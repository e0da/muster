package edu.education.ucsb.muster;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.Enumeration;
import java.util.LinkedList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringEscapeUtils;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;
import com.sidewaysmilk.justache.Justache;
import com.sidewaysmilk.justache.JustacheKeyNotFoundException;

import edu.education.ucsb.muster.MusterConfiguration.DatabaseDefinition;

/**
 * Servlet implementation class MusterServlet
 */
public class MusterServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	private static final String confPath = "/WEB-INF/muster.conf.js";

	private static final int cacheTTL = 30 * 60 * 1000; // 30 minutes

	private static final int cacheMaxLength = 128;

	private MusterConfiguration conf;

	/**
	 * If any of the files at these paths change, we should reinitialize the
	 * servlet.
	 */
	private static LinkedList<String> reloadFilePaths;

	private static LinkedList<String> requiredParameters;

	private static Justache<String, String> cache;

	public void init() {

		conf = loadConfiguration();

		// Initialize half hour cache
		cache = getJustache();

		// Set reload paths
		reloadFilePaths = new LinkedList<String>();
		reloadFilePaths.add(confPath);
		reloadFilePaths.add(conf.reloadFilePath);

		// Set required GET parameters
		requiredParameters = new LinkedList<String>();
		requiredParameters.add("database");
		requiredParameters.add("select");
		requiredParameters.add("from");
		requiredParameters.add("callback");

		testDatabaseConnectivity();
	}

	public void destroy() {
		cache.die();
	}

	private Justache<String, String> getJustache() {
		return new Justache<String, String>(cacheTTL, cacheMaxLength);
	}

	private void testDatabaseConnectivity() {

		// load drivers
		for (DatabaseDefinition db : conf.databases) {
			try {
				DriverManager.getDriver(db.url);
			} catch (SQLException e) {
				try {
					DriverManager.registerDriver((Driver) Class
							.forName(db.driver).getConstructor()
							.newInstance((Object[]) null));
				} catch (Exception e1) {
					log("A driver couldn't be loaded. Check the config file and try again. driver: `"
							+ db.driver + "`, confPath: `" + confPath + "`");
					e1.printStackTrace();
				}
			}
		}

		// connect and test setReadOnly
		for (DatabaseDefinition db : conf.databases) {

			// Add the connection to our list and try setting readOnly to test
			Connection connection = null;
			try {
				connection = DriverManager.getConnection(db.url, db.username,
						db.password);
				connection.setReadOnly(true);
				connection.close();
			} catch (Exception e) {

				// No matter what exception occurs, it should not be a show
				// stopper; we just want to see it in the logs.

				e.printStackTrace();
			}
		}
	}

	private MusterConfiguration loadConfiguration() {

		Gson gson = new Gson();
		JsonReader reader = null;
		MusterConfiguration loadedConf = null;

		try {
			reader = new JsonReader(new InputStreamReader(getServletContext()
					.getResourceAsStream(confPath), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		} catch (NullPointerException e) {
			log("Couldn't open config file `" + confPath + "`");
			e.printStackTrace();
		}

		loadedConf = gson.fromJson(reader, MusterConfiguration.class);
		loadedConf.lastLoaded = System.currentTimeMillis();
		return loadedConf;
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		if (reinitializeIfReloadFilesHaveChanged()) {
			doGet(request, response);
		}

		try {
			checkRequestValidity(request);
		} catch (InvalidRequestException e) {
			log("Invalid request. Check parameters.");
			e.printStackTrace();
			return;
		}

		String database = request.getParameter("database");
		String select = request.getParameter("select");
		String from = request.getParameter("from");
		String where = request.getParameter("where");
		String order = request.getParameter("order");
		String callback = request.getParameter("callback");

		// Construct query string
		String query = "SELECT " + select + " FROM " + from
				+ ((where == null) ? "" : " WHERE " + where)
				+ ((order == null) ? "" : " ORDER BY " + order);

		// Attempt to retrieve query from cache. If it's expired or not present,
		// perform the query and cache the result.
		String out = null;

		// Just in case the servlet ever decides that the cache thread should be
		// killed (it looks like a potential memory leak by nature), check to
		// make sure it's there before we get started.
		try {
			cache.getThread();
		} catch (NullPointerException e) {
			log("Cache thread died!");
			e.printStackTrace();
			cache = getJustache();
		}

		try {
			out = cache.get(query);
		} catch (JustacheKeyNotFoundException e) {
			try {
				out = getOutputAsJson(database, query);
				cache.put(query, out);
			} catch (SQLException e1) {
				log(query);
				e1.printStackTrace();
			}
		}

		// Set headers and write response
		response.setCharacterEncoding("UTF-8");
		PrintWriter writer = response.getWriter();
		response.setContentType("text/javascript");
		writer.println(callback + '(' + out + ')');
	}

	private String getOutputAsJson(String database, String query)
			throws SQLException {

		// The output string
		StringBuffer out = new StringBuffer();

		// Cache StringBuffer length as needed
		int len;

		// Database operations
		DatabaseDefinition db = conf.getDatabase(database);

		// //register the driver
		registerDriver(db.driver, db.url);

		// // Connect to the database
		Connection connection = DriverManager.getConnection(db.url,
				db.username, db.password);

		// // Perform the query
		PreparedStatement statement = connection.prepareStatement(query);
		statement.execute();
		ResultSet results = statement.getResultSet();

		// return an empty JSON object if the found set is empty
		results.last();
		if (results.getRow() == 0) {
			return "{}";
		}
		results.beforeFirst();

		// Get and write the column names
		ResultSetMetaData meta = results.getMetaData();
		int columnCount = meta.getColumnCount();
		LinkedList<String> columns = new LinkedList<String>();
		for (int i = 1; i < columnCount + 1; i++) {
			// We're only dealing with JSON, so the column names should be
			// JavaScript-friendly.
			columns.add(StringEscapeUtils.escapeJavaScript(meta
					.getColumnName(i)));
		}
		out.append("{ \"columns\" : [ ");

		// Add column names in JSON format
		for (String column : columns) {
			out.append('"' + column + "\", ");
		}

		// remove the trailing ", " and add a line break and close the array
		len = out.length();
		out.delete(len - 2, len);
		out.append(" ],\n");

		// Add column values
		out.append("\"results\" : [ ");

		while (results.next()) {

			out.append("{ ");

			for (String column : columns) {
				// output "column" : "value". Escape for JavaScript.
				out.append(String.format("\"%s\": \"%s\", ", column,
						StringEscapeUtils.escapeJavaScript(results
								.getString(column))));
			}

			// remove the trailing ", " and add a line break and close the
			// object
			len = out.length();
			out.delete(len - 2, len);
			out.append(" },\n");
		}

		// remove the trailing ", "
		len = out.length();
		out.delete(len - 2, len);
		out.append("]");
		out.append("}");

		return out.toString();
	}

	private void checkRequestValidity(HttpServletRequest request)
			throws InvalidRequestException {

		boolean requiredParametersAreMissing = false;
		LinkedList<String> missingRequiredParms = new LinkedList<String>();
		for (String parm : requiredParameters) {
			String val = request.getParameter(parm);
			if (val == null || val.isEmpty()) {
				requiredParametersAreMissing = true;
				missingRequiredParms.add(parm);
			}
		}
		if (requiredParametersAreMissing) {

			String missingParmsString = "";
			for (String parm : missingRequiredParms) {
				missingParmsString += parm + ", ";
			}
			missingParmsString = missingParmsString.substring(0,
					missingParmsString.length() - 2);
			throw new InvalidRequestException(
					"The request is invalid. Missing required parameter(s): "
							+ missingParmsString);

		}
	}

	private Driver registerDriver(String driver, String url) {
		try {
			DriverManager.registerDriver((Driver) Class.forName(driver)
					.getConstructor().newInstance((Object[]) null));
			return DriverManager.getDriver(url);
		} catch (Exception e) {
			log("Could not load driver `" + driver + "` for url `" + url + "`");
			e.printStackTrace();
		}
		return null;
	}

	/**
	 * Watch the files defined in reloadFilePaths for changes. If they change,
	 * reinitialize the servlet.
	 * 
	 * @param request
	 *            The Servlet request
	 * @param response
	 *            The Servlet response
	 * @return true if we reinitialized; false if we did not
	 */
	private boolean reinitializeIfReloadFilesHaveChanged() {

		long lastLoaded = conf.lastLoaded;

		for (String path : reloadFilePaths) {
			String realPath = getServletContext().getRealPath(path);
			long mtime = new File(realPath).lastModified();
			if (mtime != 0) {
				// Found a copy in Context. Remember that for the log.
				path = realPath;
			} else {
				// No Context copy. Try for an absolute path copy.
				mtime = new File(path).lastModified();
			}
			if (mtime > lastLoaded) {
				log(path + " modified.");
				log("Reinitializing...");
				init();
				return true;
			}
		}
		return false;
	}
}

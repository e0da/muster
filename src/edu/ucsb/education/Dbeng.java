package edu.ucsb.education;

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

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;

import edu.ucsb.education.DbengConfiguration.Database;

/**
 * Servlet implementation class Dbeng
 */
public class Dbeng extends HttpServlet {
	private static final long serialVersionUID = 1L;

	private static final String confPath = "/WEB-INF/dbeng.conf.js";

	private DbengConfiguration conf;

	/**
	 * If any of the files at these paths change, we should reinitialize the
	 * servlet.
	 */
	private LinkedList<String> reloadFilePaths;

	public void init() {

		conf = loadConfiguration();

		// Set reloadPaths
		reloadFilePaths = new LinkedList<String>();
		reloadFilePaths.add(confPath);
		reloadFilePaths.add(conf.reloadFilePath);

		testDatabaseConnectivity();
	}

	private void testDatabaseConnectivity() {

		// load drivers
		for (Database db : conf.databases) {
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
		for (Database db : conf.databases) {

			// Add the connection to our list and try setting readOnly to test
			Connection connection = null;
			try {
				connection = DriverManager.getConnection(db.url, db.username,
						db.password);
			} catch (SQLException e) {
				log("Could not connect to `" + db.name + "`");
				e.printStackTrace();
			}
			try {
				connection.setReadOnly(true);
			} catch (SQLException e) {
				log("Could not set readOnly for `" + db.name + "`");
				e.printStackTrace();
			}
			try {
				connection.close();
			} catch (SQLException e) {
				log("Could not close `" + db.name + "`");
				e.printStackTrace();
			}
		}

		// unload drivers
		for (Enumeration<Driver> e = DriverManager.getDrivers(); e
				.hasMoreElements();) {
			Driver driver = e.nextElement();
			try {
				DriverManager.deregisterDriver(driver);
			} catch (SQLException e1) {
				log("Could not deregister driver: `" + driver.toString() + "`");
				e1.printStackTrace();
			}
		}
	}

	private DbengConfiguration loadConfiguration() {

		Gson gson = new Gson();
		JsonReader reader = null;
		DbengConfiguration loadedConf = null;

		try {
			reader = new JsonReader(new InputStreamReader(getServletContext()
					.getResourceAsStream(confPath), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}

		loadedConf = gson.fromJson(reader, DbengConfiguration.class);
		loadedConf.lastLoaded = System.currentTimeMillis();
		return loadedConf;
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		reinitializeIfReloadFilesHaveChanged();

		/*
		 * parse requests from JSON. There can be multiple request objects, each
		 * with exactly one server and one SQL statement defined
		 */

		String database = request.getParameter("database");
		String select = request.getParameter("select");
		String from = request.getParameter("from");
		String where = request.getParameter("where");
		String order = request.getParameter("order");

		// Construct query string
		String query = "SELECT " + select + " FROM " + from
				+ ((where == null) ? "" : " WHERE " + where)
				+ ((order == null) ? "" : " ORDER BY " + order);

		log(query);

		response.setCharacterEncoding("UTF-8");
		PrintWriter writer = response.getWriter();
		// response.setContentType("application/json");
		response.setContentType("text/html");

		// fiddling
		try {
			Database db = conf.getDatabase(database);
			// Register and save a reference to driver
			Driver driver = registerDriver(db.driver, db.url);

			Connection connection = DriverManager.getConnection(db.url,
					db.username, db.password);
			PreparedStatement statement = connection.prepareStatement(query);
			statement.execute();
			ResultSet results = statement.getResultSet();
			ResultSetMetaData meta = results.getMetaData();
			int columnCount = meta.getColumnCount();
			LinkedList<String> columns = new LinkedList<String>();
			for (int i = 1; i < columnCount + 1; i++) {
				columns.add(meta.getColumnName(i));
			}

			writer.println("{ \"columns\" : [ ");

			// Reusable output buffer
			String out = "";

			for (String column : columns) {
				out += "\"" + column + "\", ";
			}

			// remove the trailing ", "
			out = out.substring(0, out.length() - 2);

			out += " ], ";

			writer.println(out);

			writer.println("\"results\" : [ ");

			int i = 1;

			out = "";
			
			while (results.next()) {

				i++;
				out += "[ ";

				for (String column : columns) {
					out += '"' + results.getString(column) + "\", ";
				}

				// remove the trailing ", " and add a line break
				out = out.substring(0, out.length() - 2);

				out += " ],\n";
			}

			// remove the trailing ", "
			out = out.substring(0, out.length() - 2);

			writer.println(out);

			writer.println("]");

			writer.println("}");

			// deregister driver
			try {
				DriverManager.deregisterDriver(driver);
			} catch (SQLException e) {
				log("Could not deregister driver `" + driver + "` for url `"
						+ db.url + "`");
				e.printStackTrace();
			}
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		// end fiddling

		writer.close();

		/*
		 * Figure out which connections we need
		 * 
		 * Load drivers
		 * 
		 * Establish connections
		 * 
		 * Perform queries
		 * 
		 * Construct JSON object
		 * 
		 * Close connections
		 * 
		 * Jettison drivers
		 * 
		 * Write JSON to PrintWriter
		 * 
		 * GTFO
		 */

		// REMEMBER to set content type to UTF-8 BEFORE creating PrintWriter
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

	private void reinitializeIfReloadFilesHaveChanged() {

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
				return;
			}
		}
	}
}

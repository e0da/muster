package edu.ucsb.education;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;

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
	private HashMap<String, Connection> connections;
	private LinkedList<String> reloadFilePaths;

	public void init() {

		connections = new HashMap<String, Connection>();
		reloadFilePaths = new LinkedList<String>();
		conf = loadConfiguration();

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
			try {
				connections.put(db.name, DriverManager.getConnection(db.url,
						db.username, db.password));
			} catch (SQLException e) {
				log("Could not connect to `" + db.name + "`");
				e.printStackTrace();
			}
			for (Map.Entry<String, Connection> entry : connections.entrySet()) {
				String name = entry.getKey();
				Connection connection = entry.getValue();
				try {
					connection.setReadOnly(true);
				} catch (SQLException e) {
					log("Could not set readOnly for `" + name + "`");
					e.printStackTrace();
				}
				try {
					connection.close();
				} catch (SQLException e) {
					log("Could not close `" + name + "`");
					e.printStackTrace();
				}
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
		/*
		 * parse requests from JSON. There can be multiple request objects, each
		 * with exactly one server and one SQL statement defined
		 */

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

		reinitializeIfNeeded();

		// Check connection status and re-establish if necessary
		// REMEMBER to set content type to UTF-8 BEFORE creating PrintWriter
	}

	private void reinitializeIfNeeded() {

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

package edu.ucsb.education;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
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
	private HashMap<String, Connection> connections;
	private LinkedList<String> drivers;
	private LinkedList<String> reloadFilePaths;

	public void init() {

		connections = new HashMap<String, Connection>();
		drivers = new LinkedList<String>();
		reloadFilePaths = new LinkedList<String>();
		conf = loadConfiguration();

		reloadFilePaths.add(confPath);
		reloadFilePaths.add(conf.reloadFilePath);

		for (Database db : conf.databases) {
			String driver = db.driver;
			if (!drivers.contains(driver)) {
				drivers.add(driver);
				try {
					Class.forName(driver);
				} catch (ClassNotFoundException e) {
					log("Could not load driver `" + driver + "`");
					e.printStackTrace();
				}
			}
			try {
				connections.put(db.name, DriverManager.getConnection(db.url,
						db.username, db.password));
			} catch (SQLException e) {
				log("SQLException using driver `" + db.driver + "`, url `"
						+ db.url + "`, username `" + db.username
						+ "`, password filtered");
				e.printStackTrace();
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
		 * parse requests from JSON There can be multiple request objects, each
		 * with exactly one server and one SQL statement defined
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

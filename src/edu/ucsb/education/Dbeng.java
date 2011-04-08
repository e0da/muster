package edu.ucsb.education;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;

import edu.ucsb.education.DbengConfiguration.DataBaseDefinition;

/**
 * Servlet implementation class Dbeng
 */
public class Dbeng extends HttpServlet {
	private static final long serialVersionUID = 1L;

	public void init() {
		// get and use configuration from JSON config file
		// build or set connections list as read from config

		// Gson noodling
		Gson gson = new Gson();
		JsonReader reader = null;
		try {
			reader = new JsonReader(new InputStreamReader(getServletContext()
					.getResourceAsStream("/WEB-INF/dbeng.conf.js"), "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			log(e.toString());
			e.printStackTrace();
		}

		DbengConfiguration conf = gson.fromJson(reader,
				DbengConfiguration.class);
		log(conf.databases[0].name);
		for (DataBaseDefinition def : conf.databases) {
			log(def.name);
		}
		log(gson.toJson(conf, DbengConfiguration.class));
		// end Gson noodling
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

		// Check connection status and re-establish if necessary
		// REMEMBER to set content type to UTF-8 BEFORE creating PrintWriter
	}
}

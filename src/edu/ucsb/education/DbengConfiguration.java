package edu.ucsb.education;

import java.util.LinkedList;

public class DbengConfiguration {

	private LinkedList<Database> databases;

	private DbengConfiguration() {
	}

	public void addDatabaseDefinition(Database def) {
		databases.add(def);
	}
	
	public Database getDatabase(String name) {
		for (Database def : databases) {
			if (def.getName().equals(name)) {
				return def;
			}
		}
		return null;
	}
	
	public Database getDatabase(int index) {
		return databases.get(index);
	}
	
	public LinkedList<Database> getDatabases() {
		return databases;
	}

	public static class Database {

		private String name;
		private String url;
		private String username;
		private String password;
		private String driver;

		Database() {
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public String getUrl() {
			return url;
		}

		public void setUrl(String url) {
			this.url = url;
		}

		public String getUsername() {
			return username;
		}

		public void setUsername(String username) {
			this.username = username;
		}

		public String getPassword() {
			return password;
		}

		public void setPassword(String password) {
			this.password = password;
		}

		public String getDriver() {
			return driver;
		}

		public void setDriver(String driver) {
			this.driver = driver;
		}

	}
}

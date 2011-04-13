package edu.ucsb.education;

import java.util.LinkedList;

public class DbengConfiguration {

	public LinkedList<Database> databases;
	public String reloadFilePath;
	public long lastLoaded;

	private DbengConfiguration() {
	}

	public void addDatabaseDefinition(Database def) {
		databases.add(def);
	}

	public Database getDatabase(String name) {
		for (Database def : databases) {
			if (def.name.equals(name)) {
				return def;
			}
		}
		return null;
	}

	public Database getDatabase(int index) {
		return databases.get(index);
	}

	public static class Database {

		public String name;
		public String url;
		public String username;
		public String password;
		public String driver;

		private Database() {
		}
	}
}

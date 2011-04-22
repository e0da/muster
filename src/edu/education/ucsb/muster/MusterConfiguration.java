package edu.education.ucsb.muster;

import java.util.LinkedList;

public class MusterConfiguration {

	public LinkedList<DatabaseDefinition> databases;
	public String reloadFilePath;
	public long lastLoaded;

	private MusterConfiguration() {
	}

	public DatabaseDefinition getDatabase(String name) {
		for (DatabaseDefinition def : databases) {
			if (def.name.equals(name)) {
				return def;
			}
		}
		return null;
	}

	public static class DatabaseDefinition {

		public String name;
		public String url;
		public String username;
		public String password;
		public String driver;

		private DatabaseDefinition() {
		}
	}
}

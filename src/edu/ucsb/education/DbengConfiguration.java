package edu.ucsb.education;

class DbengConfiguration {

	DataBaseDefinition[] databases;

	private DbengConfiguration() {
	}

	public String toString() {
		String out = "";
		for (DataBaseDefinition def : databases) {
			out += "name " + def.name + ", url" + def.url + ", username "
					+ def.username + ", password " + def.password + ", driver "
					+ def.driver;
		}
		return out;
	}

	public static class DataBaseDefinition {
		public String name, url, username, password, driver;

		private DataBaseDefinition() {
		}
	}
}

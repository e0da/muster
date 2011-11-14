package edu.education.ucsb.muster;

import java.util.Date;

public class ExceptionWrapper {

	private final Exception exception;
	private final String note;
	private final Date date;
	
	public ExceptionWrapper(Exception exception, String note) {
		this.exception = exception;
		this.note = note;
		this.date = new Date();
	}
	
	public Date getDate() {
		return date;
	}

	public Exception getException() {
		return exception;
	}

	public String getNote() {
		return note;
	}
}

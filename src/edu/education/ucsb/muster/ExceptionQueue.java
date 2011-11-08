package edu.education.ucsb.muster;

import java.util.Iterator;
import java.util.LinkedList;

public class ExceptionQueue extends LinkedList<Exception> {

	private static final long serialVersionUID = -1241577278326036721L;

	private int maxSize;
	private LinkedList<Exception> exceptions;

	public ExceptionQueue(int maxSize) {
		this.maxSize = maxSize;
		this.exceptions = new LinkedList<Exception>();
	}

	public boolean add(Exception e) {
		while (exceptions.size() >= maxSize) {
			exceptions.remove();
		}
		return exceptions.add(e);
	}
	
	public int size() {
		return exceptions.size();
	}
	
	public Iterator<Exception> iterator() {
		return exceptions.iterator();
	}

}

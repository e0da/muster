package edu.education.ucsb.muster;

import java.util.Iterator;
import java.util.LinkedList;

public class ExceptionQueue extends LinkedList<ExceptionWrapper> {

	private static final long serialVersionUID = -1241577278326036721L;

	private int maxSize;
	private LinkedList<ExceptionWrapper> exceptions;

	public ExceptionQueue(int maxSize) {
		this.maxSize = maxSize;
		this.exceptions = new LinkedList<ExceptionWrapper>();
	}

	public void push(ExceptionWrapper e) {
		while (exceptions.size() >= maxSize) {
			exceptions.removeLast();
		}
		exceptions.push(e);
	}
	
	public int size() {
		return exceptions.size();
	}
	
	public Iterator<ExceptionWrapper> iterator() {
		return exceptions.iterator();
	}

}

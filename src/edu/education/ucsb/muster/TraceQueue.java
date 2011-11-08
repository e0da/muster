package edu.education.ucsb.muster;

import java.util.LinkedList;

public class TraceQueue extends LinkedList<StackTraceElement[]> {
	
	private static final long serialVersionUID = 1279526781156576957L;

	private LinkedList<StackTraceElement[]> queue;
	private int maxSize;

	public TraceQueue(int maxSize) {
		this.queue = new LinkedList<StackTraceElement[]>();
		this.maxSize = maxSize;
	}
	
	public boolean add(StackTraceElement[] trace) {
		while (queue.size() >= maxSize) {
			queue.remove();
		}
		return super.add(trace);
	}

}

package com.example.centralized_multicast_processing_system;

import java.sql.Time;

public class PacketContent {
    private String timestamp;
    private Integer trackNumber;
    private Integer priority;
    private String payload;

    
    public PacketContent() {

    }

    public PacketContent(String timestamp, Integer trackNumber, Integer priority, String payload) {
        this.timestamp = timestamp;
        this.trackNumber = trackNumber;
        this.priority = priority;
        this.payload = payload;
    }


    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Integer getTrackNumber() {
        return trackNumber;
    }

    public void setTrackNumber(Integer trackNumber) {
        this.trackNumber = trackNumber;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    

}

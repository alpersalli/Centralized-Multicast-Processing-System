package com.example.centralized_multicast_processing_system;

import java.sql.Time;

public class PacketContent {
    private String timestamp;
    private Integer trackNumber;
    private Integer priority;
    private String payload;
    private Integer x_coordinate;
    private Integer y_coordinate;

    
    public PacketContent() {

    }

    public PacketContent(String timestamp, Integer trackNumber, Integer priority, String payload, Integer x_coordinate, Integer y_coordinate) {
        this.timestamp = timestamp;
        this.trackNumber = trackNumber;
        this.priority = priority;
        this.payload = payload;
        this.x_coordinate = x_coordinate;
        this.y_coordinate = y_coordinate;
    }


    public Integer getX_coordinate() {
        return x_coordinate;
    }

    public void setX_coordinate(Integer x_coordinate) {
        this.x_coordinate = x_coordinate;
    }

    public Integer getY_coordinate() {
        return y_coordinate;
    }

    public void setY_coordinate(Integer y_coordinate) {
        this.y_coordinate = y_coordinate;
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

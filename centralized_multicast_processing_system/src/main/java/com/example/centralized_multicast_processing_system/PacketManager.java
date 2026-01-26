package com.example.centralized_multicast_processing_system;
import java.nio.ByteBuffer;
import java.sql.Time;

import com.example.centralized_multicast_processing_system.PacketContent;

public class PacketManager extends PacketContent{

    public ByteBuffer packet_to_byte(PacketContent packet){
        ByteBuffer byte_array = ByteBuffer.allocate(90);

        /* Conversion timestamp to bytes */
        byte[] timestamp = packet.getTimestamp().getBytes();
        byte_array.put((byte)timestamp.length);
        byte_array.put(timestamp);

        byte_array.putInt(packet.getTrackNumber());
        byte_array.putInt(packet.getPriority());

        byte[] payload = packet.getPayload().getBytes();
        byte_array.put((byte)payload.length);
        byte_array.put(payload);

        byte_array.putInt(packet.getX_coordinate());
        byte_array.putInt(packet.getY_coordinate());

        byte_array.flip();

        while(byte_array.hasRemaining()){
            System.out.printf("%02X",byte_array.get());
        }
        System.out.println("\n");

        return byte_array;
    }

    public PacketContent packet_to_String(byte[] packet){

        ByteBuffer buffer = ByteBuffer.wrap(packet);
        int timestampLen = buffer.get();
        byte[] timestamp = new byte[timestampLen];
        buffer.get(timestamp);
        String timestampString = new String(timestamp);

        int trackNumber = buffer.getInt();
        int getPriority = buffer.getInt();

        int payloadLen = buffer.get();
        byte[] payload = new byte[payloadLen];
        buffer.get(payload);
        String payloadString = new String(payload);

        int x_coordinate = buffer.getInt();
        int y_coordinate = buffer.getInt();

        return new PacketContent(timestampString,trackNumber,getPriority,payloadString,x_coordinate,y_coordinate);
    }

    
}

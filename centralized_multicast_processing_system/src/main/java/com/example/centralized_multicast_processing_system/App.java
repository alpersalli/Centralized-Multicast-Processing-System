package com.example.centralized_multicast_processing_system;

import java.nio.ByteBuffer;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {

        PacketManager packetManager = new PacketManager();
        ByteBuffer testByteBuffer = packetManager.packet_to_byte(new PacketContent("10-12-2001",12,1,"TestData"));
    
        byte[] testBytes = testByteBuffer.array();

        PacketContent testPacket = new PacketManager();
        testPacket = packetManager.packet_to_String(testBytes);
        System.out.println(testPacket.getTimestamp());
        System.out.println(testPacket.getTrackNumber());
        System.out.println(testPacket.getPriority());
        System.out.println(testPacket.getPayload());
    }
}

package com.example.centralized_multicast_processing_system;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args ) throws IOException
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

        Thread serverThread = new Thread(()-> {
            try {
                ServerSocket serverSocket = new ServerSocket(6666);
                Socket socketServer = serverSocket.accept();
                System.out.println("Client accepted");
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }, "testServer");

        Thread clientThread = new Thread(()-> {
            try {
                Socket socketClient = new Socket("127.0.0.1", 6666);
                System.out.println("Client Connected");
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }, "testClient");

        serverThread.start();
        clientThread.start();
    }
}

package com.example.centralized_multicast_processing_system;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.util.Arrays;
import java.util.Properties;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args ) throws IOException
    {
        Properties props = new Properties();
        try (FileInputStream fis = new FileInputStream("centralized_multicast_processing_system/config.properties")) {
            props.load(fis);
        }
        String serverIp = props.getProperty("server.ip");
        int serverPort = Integer.parseInt(props.getProperty("server.port"));
        String clientIp = props.getProperty("client.ip");
        int clientPort = Integer.parseInt(props.getProperty("client.port"));

        PacketManager packetManager = new PacketManager();
        ByteBuffer testByteBuffer = packetManager.packet_to_byte(new PacketContent("10-12-2001",12,1,"TestData"));
    
        byte[] testBytes = testByteBuffer.array();

        PacketContent testPacket = new PacketManager();
        testPacket = packetManager.packet_to_String(testBytes);
        System.out.println(testPacket.getTimestamp());
        System.out.println(testPacket.getTrackNumber());
        System.out.println(testPacket.getPriority());
        System.out.println(testPacket.getPayload());

        Thread serverThread = new Thread(() -> {
            try {
                ServerSocket serverSocket = new ServerSocket(serverPort, 50, InetAddress.getByName(serverIp));
                System.out.println("Client accepted");
                PacketContent receivedPacketContent = new PacketContent();
                byte[] buffer = new byte[1024];

                while (true) {
                    Socket socketServer = serverSocket.accept();

                    int nextByte = socketServer.getInputStream().read(buffer);
                    if (nextByte != -1) {
                        Arrays.copyOf(buffer, nextByte);
                        receivedPacketContent = packetManager.packet_to_String(buffer);
                        System.out.println(receivedPacketContent.getTimestamp());
                        System.out.println(receivedPacketContent.getTrackNumber());
                        System.out.println(receivedPacketContent.getPriority());
                        System.out.println(receivedPacketContent.getPayload());
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }, "testServer");

        Thread clientThread = new Thread(() -> {
            try {
                PacketContent newPacketContent = new PacketContent("10-12-2001",12,1,"TestData");
                ByteBuffer buffer = packetManager.packet_to_byte(newPacketContent);
                Socket socketClient = new Socket(serverIp, serverPort);
                System.out.println("Client Connected");
                
                socketClient.getOutputStream().write(buffer.array(), 0, buffer.limit());
                socketClient.getOutputStream().flush();
                socketClient.close();
                System.out.println("Send successfully!");
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }, "testClient");

        serverThread.start();
        clientThread.start();
    }
}

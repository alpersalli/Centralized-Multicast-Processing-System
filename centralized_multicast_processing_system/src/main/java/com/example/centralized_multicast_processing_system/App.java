package com.example.centralized_multicast_processing_system;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.MulticastSocket;
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
        String multicastAddressIp = props.getProperty("multicastAddress.ip");
        int multicastAddressPort = Integer.parseInt(props.getProperty("multicastAdrress.port"));

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
                // ServerSocket serverSocket = new ServerSocket(serverPort, 50, InetAddress.getByName(serverIp));
                DatagramSocket udpSocketServer = new DatagramSocket(serverPort, InetAddress.getByName(serverIp));
                System.out.println("Client accepted");
                PacketContent receivedPacketContent = new PacketContent();
                byte[] buffer = new byte[1024];

                while (true) {
                    // Socket socketServer = serverSocket.accept();
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    udpSocketServer.receive(packet);
                    receivedPacketContent = packetManager.packet_to_String(buffer);
                    System.out.println(receivedPacketContent.getTimestamp());
                    System.out.println(receivedPacketContent.getTrackNumber());
                    System.out.println(receivedPacketContent.getPriority());
                    System.out.println(receivedPacketContent.getPayload());
                    if (buffer != null) {
                        MulticastSocket multicastSocket = new MulticastSocket();
                        InetAddress group = InetAddress.getByName(multicastAddressIp);
                        DatagramPacket pxacket = new DatagramPacket(buffer, buffer.length, group, multicastAddressPort);
                        for (int x = 0 ; x<5; x++){
                            multicastSocket.send(pxacket);
                        }
                        multicastSocket.close();
                        System.out.println("Multicast response send to all devices in same network!");
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

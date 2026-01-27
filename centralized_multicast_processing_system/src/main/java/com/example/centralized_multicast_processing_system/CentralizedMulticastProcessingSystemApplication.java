package com.example.centralized_multicast_processing_system;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.MulticastSocket;
import java.nio.ByteBuffer;
import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;


@SpringBootApplication
public class CentralizedMulticastProcessingSystemApplication {

    public static void main(String[] args) throws FileNotFoundException, IOException {
        ApplicationContext context = SpringApplication.run(CentralizedMulticastProcessingSystemApplication.class, args);

        WebSocketSender webSocketSender = context.getBean(WebSocketSender.class);

        Properties props = new Properties();
        try (FileInputStream fis = new FileInputStream("centralized_multicast_processing_system/config.properties")) {
            props.load(fis);
        }
        String serverIp = props.getProperty("server.ip");
        int serverPort = Integer.parseInt(props.getProperty("server.port"));
        String multicastAddressIp = props.getProperty("multicastAddress.ip");
        int multicastAddressPort = Integer.parseInt(props.getProperty("multicastAddress.port"));

        PacketManager packetManager = new PacketManager();
        ByteBuffer testByteBuffer = packetManager.packet_to_byte(new PacketContent("10-12-2001",12,1,"TestData",2,2));
    
        byte[] testBytes = testByteBuffer.array();

        PacketContent testPacket = new PacketManager();
        testPacket = packetManager.packet_to_String(testBytes);
        System.out.println(testPacket.getTimestamp());
        System.out.println(testPacket.getTrackNumber());
        System.out.println(testPacket.getPriority());
        System.out.println(testPacket.getPayload());
        System.out.println(testPacket.getX_coordinate());
        System.out.println(testPacket.getY_coordinate());
        
        Thread serverThread = new Thread(() -> {
            try {
                // ServerSocket serverSocket = new ServerSocket(serverPort, 50, InetAddress.getByName(serverIp));
                DatagramSocket udpSocketServer = new DatagramSocket(serverPort, InetAddress.getByName(serverIp));
                System.out.println("Client accepted");
                PacketContent receivedPacketContent = new PacketContent();
                byte[] buffer = new byte[1024];
                
                Thread.sleep(3000);
                webSocketSender.sendData(new PacketContent("10-12-2001",39485,3,"TestData",50,0));

                while (true) {
                    // Socket socketServer = serverSocket.accept();
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    udpSocketServer.receive(packet);
                    receivedPacketContent = packetManager.packet_to_String(buffer);
                    System.out.println(receivedPacketContent.getTimestamp());
                    System.out.println(receivedPacketContent.getTrackNumber());
                    System.out.println(receivedPacketContent.getPriority());
                    System.out.println(receivedPacketContent.getPayload());
                    System.out.println(receivedPacketContent.getX_coordinate());
                    System.out.println(receivedPacketContent.getY_coordinate());

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
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }, "testServer");

        Thread clientThread = new Thread(() -> {
            try {
                PacketContent newPacketContent = new PacketContent("10-12-2001",12,1,"TestData",3,4);
                ByteBuffer buffer = packetManager.packet_to_byte(newPacketContent);
                byte[] data = buffer.array();
                // Socket socketClient = new Socket(serverIp, serverPort);
                DatagramSocket udpClientSocket = new DatagramSocket();
                DatagramPacket udpPacket = new DatagramPacket(data, data.length, InetAddress.getByName(serverIp), serverPort);
                System.out.println("Client Connected");
                udpClientSocket.send(udpPacket);
                
                // socketClient.getOutputStream().write(buffer.array(), 0, buffer.limit());
                // socketClient.getOutputStream().flush();
                // socketClient.close();
                udpClientSocket.close();
                System.out.println("Send successfully!");
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }, "testClient");

        Thread multicastListenerThread = new Thread(() ->{
            try{
                MulticastSocket multicastListenerSocket = new MulticastSocket(serverPort);
                InetAddress group = InetAddress.getByName("230.0.0.0");
                multicastListenerSocket.joinGroup(group);
                PacketContent receivedMulticastPacket = new PacketContent();
                byte[] buffer = new byte[1024];
                while(true){
                    
                    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
                    multicastListenerSocket.receive(packet);
                    System.out.println("Multicast Packet received.");
                    receivedMulticastPacket = packetManager.packet_to_String(buffer);
                    System.out.println(receivedMulticastPacket.getTimestamp());
                    System.out.println(receivedMulticastPacket.getTrackNumber());
                    System.out.println(receivedMulticastPacket.getPriority());
                    System.out.println(receivedMulticastPacket.getPayload());
                    System.out.println(receivedMulticastPacket.getX_coordinate());
                    System.out.println(receivedMulticastPacket.getY_coordinate());

                }
            }
            catch (IOException e){
                e.printStackTrace();
            }
        }, "testMulticastListener");

        serverThread.start();
        // clientThread.start();
        // multicastListenerThread.start();
    }

}

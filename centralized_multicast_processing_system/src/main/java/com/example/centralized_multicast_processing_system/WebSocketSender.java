package com.example.centralized_multicast_processing_system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketSender {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void sendData(PacketContent packet) {
        messagingTemplate.convertAndSend("/packets", packet);
    }
    
    
}
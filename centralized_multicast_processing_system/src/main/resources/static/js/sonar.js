// Packet Content Sonar Viewer
class SonarViewer {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('sonarCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Packet data
        this.packets = [];
        this.maxPackets = 100;
        this.packetLifetime = 10000; // 10 seconds
        
        // Center and scale
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scale = 10;
        
        // Sonar
        this.sonarAngle = 0;
        this.sonarSpeed = 2; // degrees/frame
        
        // Statistics
        this.totalPacketsReceived = 0;
        this.latestPacketId = null;
        
        // Status
        this.isPaused = false;
        this.isConnected = false;
        
        // WebSocket
        this.ws = null;
        this.reconnectInterval = null;
        this.reconnectDelay = 3000;
        
        // UI Elements
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            totalPackets: document.getElementById('totalPackets'),
            activePoints: document.getElementById('activePoints'),
            latestPacketId: document.getElementById('latestPacketId'),
            scanStatus: document.getElementById('scanStatus'),
            pauseBtn: document.getElementById('pauseBtn'),
            clearBtn: document.getElementById('clearBtn'),
            scaleSlider: document.getElementById('scaleSlider'),
            scaleValue: document.getElementById('scaleValue')
        };
        
        this.init();
    }
    
    init() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Start WebSocket connection
        this.connectWebSocket();
        
        // Start animation loop
        this.animate();
    }
    
    setupEventListeners() {
        // Pause button
        this.elements.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
        
        // Clear button
        this.elements.clearBtn.addEventListener('click', () => {
            this.clearDisplay();
        });
        
        // Scale slider
        this.elements.scaleSlider.addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            this.elements.scaleValue.textContent = this.scale + 'x';
        });
    }
    
    connectWebSocket() {
        try {
            // WebSocket URL - adjust according to your backend
            const wsUrl = 'ws://localhost:8080/ws/packets';
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                
                // Clear reconnect interval
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const packet = JSON.parse(event.data);
                    this.processPacket(packet);
                } catch (error) {
                    console.error('Packet parsing error:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                
                // Attempt to reconnect
                if (!this.reconnectInterval) {
                    this.reconnectInterval = setInterval(() => {
                        console.log('Attempting to reconnect...');
                        this.connectWebSocket();
                    }, this.reconnectDelay);
                }
            };
            
        } catch (error) {
            console.error('WebSocket creation error:', error);
            this.updateConnectionStatus('error');
        }
    }
    
    processPacket(packet) {
        // Extract coordinates from packet content
        // Assuming packet structure: { id, packetContent: { x, y, ... }, timestamp }
        
        if (!packet || !packet.packetContent) {
            console.warn('Invalid packet structure:', packet);
            return;
        }
        
        const content = packet.packetContent;
        
        // Check if coordinates exist
        if (typeof content.x === 'undefined' || typeof content.y === 'undefined') {
            console.warn('Packet missing coordinates:', packet);
            return;
        }
        
        // Create display packet
        const displayPacket = {
            id: packet.id || this.generateId(),
            x: parseFloat(content.x),
            y: parseFloat(content.y),
            timestamp: packet.timestamp || Date.now(),
            data: content // Store all packet content for tooltip
        };
        
        this.addPacket(displayPacket);
    }
    
    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    addPacket(packet) {
        // Add timestamp if not present
        if (!packet.timestamp) {
            packet.timestamp = Date.now();
        }
        
        this.packets.push(packet);
        this.totalPacketsReceived++;
        this.latestPacketId = packet.id;
        
        // Remove old packets if max count exceeded
        if (this.packets.length > this.maxPackets) {
            this.packets.shift();
        }
        
        console.log('Packet added:', packet);
        this.updateStats();
    }
    
    updateStats() {
        // Clean old packets
        const now = Date.now();
        this.packets = this.packets.filter(
            packet => now - packet.timestamp < this.packetLifetime
        );
        
        // Update UI
        this.elements.totalPackets.textContent = this.totalPacketsReceived;
        this.elements.activePoints.textContent = this.packets.length;
        this.elements.latestPacketId.textContent = this.latestPacketId || '-';
    }
    
    updateConnectionStatus(status) {
        const statusMap = {
            'connected': { text: 'CONNECTED', class: 'status-connected' },
            'disconnected': { text: 'DISCONNECTED', class: 'status-disconnected' },
            'connecting': { text: 'CONNECTING...', class: 'status-connecting' },
            'error': { text: 'ERROR', class: 'status-disconnected' }
        };
        
        const statusInfo = statusMap[status] || statusMap['disconnected'];
        this.elements.connectionStatus.textContent = statusInfo.text;
        this.elements.connectionStatus.className = 'stat-value ' + statusInfo.class;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.elements.pauseBtn.textContent = 'RESUME SCAN';
            this.elements.pauseBtn.classList.add('paused');
            this.elements.scanStatus.textContent = 'PAUSED';
            this.elements.scanStatus.className = 'stat-value status-paused';
        } else {
            this.elements.pauseBtn.textContent = 'PAUSE SCAN';
            this.elements.pauseBtn.classList.remove('paused');
            this.elements.scanStatus.textContent = 'ACTIVE';
            this.elements.scanStatus.className = 'stat-value status-active';
        }
    }
    
    clearDisplay() {
        this.packets = [];
        this.updateStats();
        console.log('Display cleared');
    }
    
    animate() {
        // Update sonar angle
        if (!this.isPaused) {
            this.sonarAngle = (this.sonarAngle + this.sonarSpeed) % 360;
        }
        
        // Update statistics
        this.updateStats();
        
        // Draw screen
        this.draw();
        
        // Next frame
        requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Background
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Grid lines
        this.drawGrid();
        
        // Sonar rings
        this.drawSonarRings();
        
        // Center lines
        this.drawCenterLines();
        
        // Sonar sweep beam
        this.drawSonarBeam();
        
        // Draw packets
        this.drawPackets();
        
        // Center point
        this.drawCenter();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#1a3a52';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let i = 0; i <= this.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.width, i);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    drawSonarRings() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#2a4a62';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        const maxRadius = Math.min(this.width, this.height) / 2 - 50;
        const ringCount = 7;
        
        for (let i = 1; i <= ringCount; i++) {
            const radius = (maxRadius / ringCount) * i;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw radius label
            ctx.fillStyle = '#3a5a72';
            ctx.font = '10px monospace';
            ctx.fillText(
                `${(radius / this.scale).toFixed(0)}`,
                this.centerX + radius - 15,
                this.centerY - 5
            );
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    drawCenterLines() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#3a5a72';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(this.centerX, 0);
        ctx.lineTo(this.centerX, this.height);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, this.centerY);
        ctx.lineTo(this.width, this.centerY);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
    }
    
    drawSonarBeam() {
        const ctx = this.ctx;
        const angleRad = (this.sonarAngle * Math.PI) / 180;
        const maxRadius = Math.min(this.width, this.height) / 2 - 50;
        
        // Create gradient
        const endX = this.centerX + Math.cos(angleRad) * maxRadius;
        const endY = this.centerY + Math.sin(angleRad) * maxRadius;
        
        const gradient = ctx.createLinearGradient(
            this.centerX, this.centerY, endX, endY
        );
        gradient.addColorStop(0, 'rgba(0, 255, 150, 0.6)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 150, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 150, 0)');
        
        // Draw sweep beam
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.arc(
            this.centerX, 
            this.centerY, 
            maxRadius, 
            angleRad - 0.15, 
            angleRad + 0.15
        );
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw beam line
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawPackets() {
        const ctx = this.ctx;
        const now = Date.now();
        
        this.packets.forEach(packet => {
            // Calculate opacity based on age
            const age = now - packet.timestamp;
            const opacity = Math.max(0, 1 - age / this.packetLifetime);
            
            // Convert to screen coordinates
            const screenX = this.centerX + (packet.x * this.scale);
            const screenY = this.centerY - (packet.y * this.scale);
            
            // Skip if outside canvas
            if (screenX < 0 || screenX > this.width || screenY < 0 || screenY > this.height) {
                return;
            }
            
            // Glow effect
            const glowGradient = ctx.createRadialGradient(
                screenX, screenY, 0, screenX, screenY, 20
            );
            glowGradient.addColorStop(0, `rgba(0, 255, 150, ${opacity * 0.8})`);
            glowGradient.addColorStop(0.5, `rgba(0, 255, 150, ${opacity * 0.4})`);
            glowGradient.addColorStop(1, 'rgba(0, 255, 150, 0)');
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
            
            // Main point
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 150, ${opacity})`;
            ctx.fill();
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Coordinate text
            ctx.fillStyle = `rgba(0, 255, 150, ${opacity * 0.8})`;
            ctx.font = '11px monospace';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 3;
            ctx.fillText(
                `(${packet.x.toFixed(1)}, ${packet.y.toFixed(1)})`,
                screenX + 10,
                screenY - 10
            );
            ctx.shadowBlur = 0;
            
            // Packet ID (smaller)
            ctx.fillStyle = `rgba(150, 200, 255, ${opacity * 0.6})`;
            ctx.font = '9px monospace';
            const idText = String(packet.id).substring(0, 8);
            ctx.fillText(
                idText,
                screenX + 10,
                screenY + 5
            );
        });
    }
    
    drawCenter() {
        const ctx = this.ctx;
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, 15
        );
        glowGradient.addColorStop(0, 'rgba(255, 51, 102, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 51, 102, 0)');
        
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Center point
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3366';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Center cross
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.centerX - 12, this.centerY);
        ctx.lineTo(this.centerX + 12, this.centerY);
        ctx.moveTo(this.centerX, this.centerY - 12);
        ctx.lineTo(this.centerX, this.centerY + 12);
        ctx.stroke();
    }
}

// Start when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Sonar Viewer...');
    new SonarViewer();
});
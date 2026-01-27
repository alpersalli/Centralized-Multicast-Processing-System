class WebSocketConnection {
    constructor(sonarViewer) {
        this.socket = null;
        this.stompClient = null;
        this.isPaused = false;
        this.messageCountUpdates = 0;
        this.messageCountPackets = 0;
        this.sonarViewer = sonarViewer;
        this.connect();
    }

    connect() {
        console.log('Connecting to WebSocket...');
        this.socket = new SockJS('http://localhost:8080/ws');
        this.stompClient = Stomp.over(this.socket);

        this.stompClient.connect({}, (frame) => {
            console.log('✅ WebSocket connected successfully');

            this.stompClient.subscribe('/packets', (message) => {
                if (!this.isPaused) {
                    this.messageCountPackets++;
                    try {
                        const packet = JSON.parse(message.body);
                        console.log('Packet received:', packet);
                        
                        // Send packet to sonar viewer for display
                        if (this.sonarViewer) {
                            this.sonarViewer.addTarget(packet);
                        }

                    } catch (e) {
                        console.error('JSON parsing error:', e);
                    }
                }
            });

        }, (error) => {
            console.error('❌ WebSocket connection error:', error);
            setTimeout(() => this.connect(), 5000);
        });
    }

    pause() {
        this.isPaused = true;
        console.log('WebSocket paused');
    }

    resume() {
        this.isPaused = false;
        console.log('WebSocket resumed');
    }
}


class SonarViewer {
    constructor() {
        this.canvas = document.getElementById('radarCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.maxRadius = this.canvas.width / 2 - 20;
        
        // Store active targets
        this.targets = new Map();
        this.targetLifetime = 10000; // 10 seconds
        
        // Animation
        this.sweepAngle = 0;
        this.sweepSpeed = 0.02;
        
        this.init();
    }

    init() {
        this.drawRadarBase();
        this.animate();
    }

    drawRadarBase() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#050810';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw concentric circles
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, (this.maxRadius / 4) * i, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw cross lines
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY - this.maxRadius);
        ctx.lineTo(this.centerX, this.centerY + this.maxRadius);
        ctx.moveTo(this.centerX - this.maxRadius, this.centerY);
        ctx.lineTo(this.centerX + this.maxRadius, this.centerY);
        ctx.stroke();
        
        // Draw distance labels
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        for (let i = 1; i <= 4; i++) {
            const radius = (this.maxRadius / 4) * i;
            const distance = (25 * i).toString(); // 25, 50, 75, 100 units
            ctx.fillText(distance, this.centerX + 5, this.centerY - radius - 5);
        }
    }

    drawSweep() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.maxRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.sweepAngle);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.maxRadius, 0, Math.PI / 6);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
    }

    cartesianToRadar(x, y) {
        // Convert cartesian coordinates to radar screen coordinates
        // Assuming input coordinates are in range 0-100
        
        // Scale coordinates to fit radar (0-100 maps to 0-maxRadius)
        const scaledX = (x / 100) * this.maxRadius;
        const scaledY = (y / 100) * this.maxRadius;
        
        // Convert to screen coordinates (origin at center)
        const screenX = this.centerX + scaledX;
        const screenY = this.centerY - scaledY; // Invert Y axis
        
        return { x: screenX, y: screenY };
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 1:
                return '#ff0000'; // High priority - Red
            case 2:
                return '#ffaa00'; // Medium priority - Orange
            case 3:
                return '#00ff00'; // Low priority - Green
            default:
                return '#ffffff'; // Unknown - White
        }
    }

    addTarget(packet) {
        const targetId = packet.trackNumber;
        
        // Store target data
        this.targets.set(targetId, {
            x: packet.x_coordinate,
            y: packet.y_coordinate,
            priority: packet.priority,
            trackNumber: packet.trackNumber,
            timestamp: packet.timestamp,
            payload: packet.payload,
            addedTime: Date.now()
        });
        
        // Update targets list in UI
        this.updateTargetsList();
        
        console.log(`Target ${targetId} added at (${packet.x_coordinate}, ${packet.y_coordinate})`);
    }

    drawTargets() {
        const ctx = this.ctx;
        const currentTime = Date.now();
        
        // Remove old targets
        for (const [id, target] of this.targets.entries()) {
            if (currentTime - target.addedTime > this.targetLifetime) {
                this.targets.delete(id);
            }
        }
        
        // Draw active targets
        this.targets.forEach((target, id) => {
            const pos = this.cartesianToRadar(target.x, target.y);
            const color = this.getPriorityColor(target.priority);
            
            // Calculate fade effect based on age
            const age = currentTime - target.addedTime;
            const opacity = 1 - (age / this.targetLifetime);
            
            // Draw target dot
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw target ring
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw track number
            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`T${target.trackNumber}`, pos.x + 15, pos.y + 5);
            
            ctx.globalAlpha = 1.0;
        });
    }

    updateTargetsList() {
        const targetsList = document.getElementById('targetsList');
        
        if (this.targets.size === 0) {
            targetsList.innerHTML = '<div style="color: #00ff00; opacity: 0.5;">No active targets</div>';
            return;
        }
        
        let html = '<h3 style="margin-bottom: 10px;">Active Targets</h3>';
        
        this.targets.forEach((target, id) => {
            const priorityText = ['', 'HIGH', 'MEDIUM', 'LOW'][target.priority] || 'UNKNOWN';
            const color = this.getPriorityColor(target.priority);
            
            html += `
                <div class="target-item" style="border-color: ${color}; color: ${color};">
                    <strong>Track ${target.trackNumber}</strong> - Priority: ${priorityText}<br>
                    Position: (${target.x}, ${target.y})<br>
                    <small>${target.timestamp}</small>
                </div>
            `;
        });
        
        targetsList.innerHTML = html;
    }

    animate() {
        // Redraw radar base
        this.drawRadarBase();
        
        // Draw targets
        this.drawTargets();
        
        // Draw sweep
        this.drawSweep();
        
        // Update sweep angle
        this.sweepAngle += this.sweepSpeed;
        if (this.sweepAngle > Math.PI * 2) {
            this.sweepAngle = 0;
        }
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}

const sonarViewer = new SonarViewer();
const webSocketConnection = new WebSocketConnection(sonarViewer);
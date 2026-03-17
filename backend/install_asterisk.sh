#!/bin/bash
# ==============================================================================
# Outsmart OBD - Asterisk One-Click Installer & Configurator
# ==============================================================================
# This script installs Asterisk and configures it for use with the OBD Dashboard.
# It sets up AMI (Manager Interface) and a basic Outbound IVR Dialplan.
# ==============================================================================

echo "🚀 Starting Asterisk Installation for Outsmart OBD..."

# 1. Install Asterisk
echo "📥 Installing Asterisk..."
sudo apt-get update
sudo apt-get install -y asterisk

# 2. Configure Manager (AMI) 
# This allows the Python Dashboard to send commands to Asterisk
echo "⚙️ Configuring Asterisk Manager (AMI)..."
sudo tee /etc/asterisk/manager.conf <<EOF
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = amp111
deny = 0.0.0.0/0.0.0.0
permit = 0.0.0.0/0.0.0.0
read = system,call,log,verbose,command,agent,user,config
write = system,call,log,verbose,command,agent,user,config
EOF

# 3. Configure Dialplan (OBD Logic)
# This handles the call flow: Answer -> Play Prompt -> Capture Input -> Action
echo "🧠 Configuring OBD Dialplan..."
sudo tee /etc/asterisk/extensions.conf <<EOF
[general]
static=yes
writeprotect=no

[from-internal]
; Extension 5566 is our campaign trigger point
exten => 5566,1,NoOp(Starting Outsmart OBD Campaign)
 same => n,Answer()
 same => n,Wait(1)
 ; This is where the AI prompt would be played
 same => n,Playback(hello-world) 
 same => n,Read(USER_INPUT,,1,,,10) ; Wait 10s for customer to press a key
 same => n,NoOp(Customer Input Captured: \${USER_INPUT})
 
 ; Logic: If user presses 1, confirm success. Else, hang up.
 same => n,GotoIf(\$["\${USER_INPUT}" = "1"]?success:failed)

 same => n(success),NoOp(Campaign Success: Customer Pressed 1)
 same => n,Playback(auth-thankyou)
 same => n,Hangup()

 same => n(failed),NoOp(Campaign Close: No Input or Invalid)
 same => n,Playback(vm-goodbye)
 same => n,Hangup()
EOF

# 4. Restart & Apply
echo "🔄 Restarting Asterisk to apply settings..."
sudo systemctl restart asterisk
sudo asterisk -rx "core reload"
sudo asterisk -rx "manager reload"

# 5. Summary
IP_ADDR=$(hostname -I | awk '{print $1}')
echo "=============================================================================="
echo "✅ ASTERISK SETUP COMPLETE!"
echo "=============================================================================="
echo "📍 VM IP Address: $IP_ADDR"
echo "🔑 AMI Username:  admin"
echo "🔑 AMI Password:  amp111"
echo "🔌 AMI Port:      5038"
echo "🏗️ Context:       from-internal"
echo "🏗️ Extension:     5566"
echo "=============================================================================="
echo "👉 Now, update your .env file on your Mac with these details and set VOIP_MODE=sip"
echo "=============================================================================="

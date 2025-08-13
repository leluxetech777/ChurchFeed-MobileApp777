import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface FloatingMessagesProps {
  messages?: string[];
  messageCount?: number;
  style?: any;
}

const defaultMessages = [
  "John 3:16 — For God so loved the world...",
  "Sunday Service — 10:30 AM",
  "Youth Fellowship — Wednesday 7 PM",
  "Prayer Meeting — Friday 6 PM",
  "Bible Study — Tuesday 7 PM",
  "Worship Night — Saturday 8 PM",
  "Community Outreach — Monthly",
  "Children's Ministry — Sunday 9 AM",
  "Romans 8:28 — All things work together...",
  "Philippians 4:13 — I can do all things...",
  "Psalms 23:1 — The Lord is my shepherd...",
  "Matthew 11:28 — Come unto me all ye...",
  "Ephesians 2:8 — For by grace you have...",
  "Jeremiah 29:11 — For I know the plans...",
  "1 Corinthians 13:4 — Love is patient...",
  "Proverbs 3:5 — Trust in the Lord...",
  "Isaiah 40:31 — Those who hope in the Lord...",
  "Matthew 28:19 — Go and make disciples...",
  "Women's Bible Study — Thursday 9 AM",
  "Men's Fellowship — Saturday 7 AM",
  "Food Pantry — 2nd Saturday",
  "Vacation Bible School — Summer",
  "Christmas Service — December 25th",
  "Easter Celebration — Spring",
  "Baptism Service — First Sunday"
];

export default function FloatingMessages({ 
  messages = defaultMessages, 
  messageCount = 8,
  style 
}: FloatingMessagesProps) {
  const messagesRef = useRef<Array<{
    id: number;
    text: string;
    animatedX: Animated.Value;
    animatedY: Animated.Value;
    animatedOpacity: Animated.Value;
    velocityX: number;
    velocityY: number;
    width: number;
    isAnimating: boolean;
  }>>([]);
  
  const animationLoopRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Initialize messages immediately
  if (!initializedRef.current) {
    for (let i = 0; i < messageCount; i++) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const randomX = Math.random() * (width - 200);
      const randomY = Math.random() * height;
      
      messagesRef.current.push({
        id: i,
        text: randomMessage,
        animatedX: new Animated.Value(randomX),
        animatedY: new Animated.Value(randomY),
        animatedOpacity: new Animated.Value(0.8),
        velocityX: (Math.random() - 0.5) * 100, // Random horizontal velocity
        velocityY: -50 - Math.random() * 50, // Upward velocity
        width: 200,
        isAnimating: false,
      });
    }
    initializedRef.current = true;
  }

  // Physics-based animation loop
  const startPhysicsLoop = () => {
    const animate = () => {
      messagesRef.current.forEach((message) => {
        if (message.isAnimating) return;
        
        message.isAnimating = true;
        
        // Get current position
        const currentX = (message.animatedX as any)._value;
        const currentY = (message.animatedY as any)._value;
        
        // Calculate new position
        let newX = currentX + message.velocityX * 0.016; // 60fps
        let newY = currentY + message.velocityY * 0.016;
        
        // Bounce off left and right walls
        if (newX <= 0 || newX >= width - message.width) {
          message.velocityX = -message.velocityX * 0.8; // Damping on bounce
          newX = Math.max(0, Math.min(width - message.width, newX));
        }
        
        // Reset when message goes off top of screen
        if (newY < -100) {
          // Reset to bottom with new random message and position
          newY = height + 50;
          newX = Math.random() * (width - message.width);
          message.velocityX = (Math.random() - 0.5) * 100;
          message.velocityY = -50 - Math.random() * 50;
          message.text = messages[Math.floor(Math.random() * messages.length)];
        }
        
        // Apply gravity-like upward force
        message.velocityY -= 0.5;
        
        // Animate to new position
        Animated.parallel([
          Animated.timing(message.animatedX, {
            toValue: newX,
            duration: 16, // 60fps
            useNativeDriver: false,
          }),
          Animated.timing(message.animatedY, {
            toValue: newY,
            duration: 16,
            useNativeDriver: false,
          }),
        ]).start(() => {
          message.isAnimating = false;
        });
      });
      
      // Continue the loop
      animationLoopRef.current = setTimeout(animate, 16); // 60fps
    };
    
    animate();
  };

  // Start animations immediately
  useEffect(() => {
    // Stagger the initial appearance
    messagesRef.current.forEach((message, index) => {
      setTimeout(() => {
        Animated.timing(message.animatedOpacity, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }, index * 200); // 200ms between each message appearing
    });

    // Start physics loop after brief delay
    setTimeout(() => {
      startPhysicsLoop();
    }, 1000);

    // Cleanup
    return () => {
      if (animationLoopRef.current) {
        clearTimeout(animationLoopRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {messagesRef.current.map((message) => (
        <Animated.View
          key={message.id}
          style={[
            styles.messageContainer,
            {
              left: message.animatedX,
              top: message.animatedY,
              opacity: message.animatedOpacity,
            },
          ]}
        >
          <Text style={styles.messageText}>{message.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5, // Above background, below main content
  },
  messageContainer: {
    position: 'absolute',
    maxWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
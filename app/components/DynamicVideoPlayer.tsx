import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type Props = { videoUrl: string };

export default function DynamicVideoPlayer({ videoUrl }: Props) {
  const videoRef = useRef<Video>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [videoDimensions, setVideoDimensions] = useState({ 
    width: screenWidth * 0.9, 
    height: screenWidth * 0.9 * (9/16) // Default 16:9 ratio
  });

  // Dynamic maximum dimensions (90% of screen width, 40% of screen height)
  const MAX_WIDTH = screenWidth * 0.9;
  const MAX_HEIGHT = screenHeight * 0.4;

  const handleVideoLoad = async (status: AVPlaybackStatus) => {
    const s = status as any;
    if (!s.isLoaded || !videoRef.current) return;
    
    try {
      const { naturalSize } = s.naturalSize;
      if (!naturalSize.width || !naturalSize.height) return;

      const aspectRatio = naturalSize.width / naturalSize.height;

      // Calculate initial dimensions based on width
      let width = MAX_WIDTH;
      let height = width / aspectRatio;

      // If too tall, recalculate based on height
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT;
        width = height * aspectRatio;
      }

      // Ensure we don't exceed max dimensions
      const finalWidth = Math.min(width, MAX_WIDTH);
      const finalHeight = Math.min(height, MAX_HEIGHT);

      setVideoDimensions({
        width: finalWidth,
        height: finalHeight
      });

      // Force UI update if needed
      await videoRef.current.getStatusAsync();
    } catch (error) {
      console.error('Error handling video load:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{
        width: videoDimensions.width,
        height: videoDimensions.height,
        backgroundColor: 'rgba(0,0,0,0.05)', // Very light background
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{
            width: videoDimensions.width,
            height: videoDimensions.height,
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          onPlaybackStatusUpdate={handleVideoLoad}
          shouldPlay={false}
        />
      </View>
      <Text style={styles.caption}>Recipe Video</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  caption: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
});
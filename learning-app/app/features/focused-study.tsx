import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

const SESSION_DURATION = 25 * 60; // 25 minutes

// Simple ProgressBar Component
const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <View style={progressBarStyles.container}>
      <View style={[progressBarStyles.bar, { width: `${Math.min(progress, 1) * 100}%` }]} />
    </View>
  );
};

const progressBarStyles = StyleSheet.create({
  container: {
    height: 10,
    backgroundColor: colors.gray[300],
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 8,
  },
  bar: {
    height: 10,
    backgroundColor: colors.primary,
  },
});

// Helper: Convert standard YouTube URL to embed URL
function convertToEmbedUrl(url: string): string {
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

export default function FocusedStudy() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_DURATION);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Timer interval reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start study session
  function handleStartStudying() {
    if (!videoUrl) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }
    setIsPlaying(true);
    setSessionTimeLeft(SESSION_DURATION);
  }

  // Stop study session
  function handleStopStudying() {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setSessionTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            Alert.alert('Session Complete', 'Great job on completing your study session!');
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const progress = (SESSION_DURATION - sessionTimeLeft) / SESSION_DURATION;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Video URL Input and Controls */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="Enter YouTube video URL"
          placeholderTextColor={colors.gray[400]}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.button, isPlaying && styles.stopButton]}
          onPress={() => isPlaying ? handleStopStudying() : handleStartStudying()}
        >
          <MaterialIcons
            name={isPlaying ? "stop" : "play-arrow"}
            size={24}
            color={colors.background}
          />
          <Text style={styles.buttonText}>
            {isPlaying ? 'Stop Studying' : 'Start Studying'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer and Full Screen Controls */}
      {isPlaying && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(sessionTimeLeft)}</Text>
          <ProgressBar progress={progress} />
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => setIsFullScreen(true)}
          >
            <MaterialIcons name="fullscreen" size={24} color={colors.background} />
            <Text style={styles.buttonText}>Full Screen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <View style={styles.modalContainer}>
          <WebView
            source={{ uri: convertToEmbedUrl(videoUrl) || 'https://youtube.com' }}
            style={styles.fullScreenVideo}
          />
          <TouchableOpacity
            style={styles.exitFullScreenButton}
            onPress={() => setIsFullScreen(false)}
          >
            <MaterialIcons name="close" size={24} color={colors.background} />
            <Text style={styles.buttonText}>Exit Full Screen</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inputContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    fontSize: fonts.sizes.base,
    color: colors.text,
    marginRight: 8,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    marginLeft: 4,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  timerText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  fullScreenButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  fullScreenVideo: {
    flex: 1,
  },
  exitFullScreenButton: {
    backgroundColor: colors.error,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

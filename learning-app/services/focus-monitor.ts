import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let sound: Audio.Sound | null = null;

// Create a simple beep sound
async function createBeepSound() {
  if (Platform.OS === 'web') return;
  
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });

  const { sound: newSound } = await Audio.Sound.createAsync(
    { uri: 'https://raw.githubusercontent.com/expo/expo/master/apps/native-component-list/assets/sounds/beep.mp3' },
    { shouldPlay: false, volume: 1.0 }
  );
  
  sound = newSound;
}

export async function loadFocusModel() {
  try {
    await createBeepSound();
    return true;
  } catch (error) {
    console.error('Error initializing:', error);
    return false;
  }
}

export async function checkFocus(): Promise<boolean> {
  return true; // Always return focused for now
}

export async function playAlertSound() {
  try {
    if (!sound) {
      await createBeepSound();
    }
    
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.error('Error playing alert:', error);
  }
}

export async function cleanup() {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }
}
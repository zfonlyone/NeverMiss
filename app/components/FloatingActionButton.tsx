import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FloatingActionButtonProps {
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  position?: 'bottomRight' | 'bottomLeft';
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  position = 'bottomRight'
}: FloatingActionButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/new-task');
    }
  };

  return (
    <View style={[
      styles.container,
      position === 'bottomLeft' ? styles.bottomLeft : styles.bottomRight
    ]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
      >
        <Ionicons name={icon} size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  bottomRight: {
    right: 20,
    bottom: 20,
  },
  bottomLeft: {
    left: 20,
    bottom: 20,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
}); 
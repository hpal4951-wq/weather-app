import { SafeAreaView, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

import { useEffect, useState } from "react";
import { YStack } from "tamagui";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RadarPoint {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

export function LinkingAnimation() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [points, setPoints] = useState<RadarPoint[]>([]);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
    );

    pulse.value = withRepeat(
      withTiming(1.2, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const newPoint: RadarPoint = {
        id: Date.now(),
        x,
        y,
        opacity: 1,
      };

      setPoints((prev) => [...prev, newPoint]);

      setTimeout(() => {
        setPoints((prev) => prev.filter((p) => p.id !== newPoint.id));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <YStack alignItems="center" justifyContent="center" width={140} height={140}>
      <View style={styles.radarContainer}>
        <View style={styles.outerRing} />
        <View style={styles.middleRing} />
        <View style={styles.innerRing} />

        {points.map((point) => (
          <View
            key={point.id}
            style={[
              styles.radarPoint,
              {
                left: 70 + point.x,
                top: 70 + point.y,
                opacity: point.opacity,
              },
            ]}
          />
        ))}

        <Animated.View style={[styles.sweepHand, sweepStyle]}>
          <View style={styles.sweepMask}>
            <LinearGradient
              colors={["rgba(220, 38, 38, 0)", "rgba(220, 38, 38, 0.4)", "#DC2626"]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.sweepGradient}
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.pulseRing, pulseStyle]} />
      </View>

      <YStack
        width={12}
        height={12}
        borderRadius={6}
        backgroundColor="#DC2626"
        style={{ shadowColor: "#DC2626", shadowOpacity: 0.8, shadowRadius: 8 }}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  radarContainer: {
    width: 140,
    height: 140,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.4)",
  },
  middleRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.6)",
  },
  innerRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.8)",
  },
  sweepHand: {
    position: "absolute",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  sweepMask: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
  },
  sweepGradient: {
    position: "absolute",
    width: 140,
    height: 70,
    top: 0,
    left: 0,
  },
  radarPoint: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(220, 38, 38, 0.3)",
  },
});

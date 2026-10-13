import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Header Bar */}
        <View style={styles.header}>
          <Text style={styles.logoText}>KinD<Text style={styles.logoDot}>!</Text></Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        </View>

        {/* 2. Daily Energy Tracker Card */}
        <View style={styles.energyCard}>
          <Text style={styles.subGreeting}>GOOD MORNING, MALI</Text>
          <Text style={styles.mainTitle}>What sounds good to you today?</Text>
          
          <View style={styles.trackerRow}>
            <View style={styles.circleProgress}>
              <Text style={styles.percentText}>70%</Text>
            </View>
            <View style={styles.energyDetail}>
              <Text style={styles.energyLabel}>Daily energy</Text>
              <Text style={styles.energyValue}>
                <Text style={styles.boldCal}>1,400</Text> / 2,100 kcal
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Freshness Alert Banner */}
        <View style={styles.freshAlertBanner}>
          <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
          <View style={styles.freshAlertTextContainer}>
            <Text style={styles.freshAlertTitle}>Use them while they're fresh</Text>
            <Text style={styles.freshAlertSub}>Spinach, tomato, and tofu expire soon.</Text>
          </View>
        </View>

        {/* 4. AI Fridge Hero Card (สแกนตู้เย็น) */}
        <View style={styles.aiHeroCard}>
          <View style={styles.aiBadge}>
            <FontAwesome5 name="sparkles" size={12} color="#FFF" />
            <Text style={styles.aiBadgeText}>AI FRIDGE CHEF</Text>
          </View>
          
          <Text style={styles.aiHeroTitle}>Turn what you have into something delicious.</Text>
          <Text style={styles.aiHeroSub}>
            Snap a photo of your fridge or list your ingredients. We'll plan a meal that fits your goals.
          </Text>

          {/* Input Type Selector */}
          <View style={styles.inputSelectorRow}>
            <TouchableOpacity style={[styles.selectorBtn, styles.selectorActive]}>
              <Ionicons name="camera-outline" size={16} color="#000" />
              <Text style={styles.selectorText}>Photo / Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorBtn}>
              <Ionicons name="list-outline" size={16} color="#000" />
              <Text style={styles.selectorText}>Ingredient list</Text>
            </TouchableOpacity>
          </View>

          {/* CTA Action Button */}
          <TouchableOpacity style={styles.clearFridgeBtn}>
            <Text style={styles.clearFridgeBtnText}>Clear the fridge with AI ✨</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Trending Today */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSub}>TRENDING TODAY</Text>
          <Text style={styles.sectionTitle}>Top 10 daily</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          <View style={styles.recipeCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624' }} 
              style={styles.recipeImage} 
            />
            <TouchableOpacity style={styles.favButton}>
              <Ionicons name="heart-outline" size={18} color="#000" />
            </TouchableOpacity>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle}>Jammy egg veggie ramen</Text>
              <Text style={styles.recipeMeta}>520 kcal • 24g protein</Text>
            </View>
          </View>
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  logoDot: { color: '#E85D36' },
  notificationBtn: { padding: 8, position: 'relative' },
  badgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E85D36' },
  energyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  subGreeting: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
  mainTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginVertical: 6 },
  trackerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  circleProgress: { width: 50, height: 50, borderRadius: 25, borderWidth: 4, borderColor: '#E85D36', justifyContent: 'center', alignItems: 'center' },
  percentText: { fontSize: 12, fontWeight: 'bold' },
  energyDetail: { marginLeft: 16 },
  energyLabel: { fontSize: 12, color: '#8E8E93' },
  energyValue: { fontSize: 16, color: '#1C1C1E' },
  boldCal: { fontWeight: 'bold', fontSize: 18 },
  freshAlertBanner: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  freshAlertTextContainer: { marginLeft: 10 },
  freshAlertTitle: { fontWeight: 'bold', fontSize: 13, color: '#92400E' },
  freshAlertSub: { fontSize: 11, color: '#B45309' },
  aiHeroCard: { backgroundColor: '#E85D36', borderRadius: 24, padding: 20, marginBottom: 24 },
  aiBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  aiBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  aiHeroTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  aiHeroSub: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  inputSelectorRow: { flexDirection: 'row', marginBottom: 12 },
  selectorBtn: { backgroundColor: '#FFF', opacity: 0.8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  selectorActive: { opacity: 1 },
  selectorText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  clearFridgeBtn: { backgroundColor: '#FCD34D', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  clearFridgeBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  sectionHeader: { marginBottom: 12 },
  sectionSub: { fontSize: 11, fontWeight: '700', color: '#E85D36' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  horizontalList: { flexDirection: 'row' },
  recipeCard: { width: 200, backgroundColor: '#FFF', borderRadius: 16, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF' },
  recipeImage: { width: '100%', height: 130 },
  favButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 12, padding: 6 },
  recipeInfo: { padding: 10 },
  recipeTitle: { fontWeight: 'bold', fontSize: 14 },
  recipeMeta: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
});
import React from 'react';
import { Image, Text, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import { Icons, Images } from '@/assets';
import { height, theme, width, ms, vs, hs, typography } from '@/theme';
import { hexToRGBA } from '@/utils/helper';

export function HeadersInner({ nav, title, icon }) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => nav.goBack()}>
            <Image source={Icons.back} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.completText}>{title}</Text>
        </View>
        {icon}
      </View>
      <Image source={Images.profileBackImage} style={styles.profileBackImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? vs(40) : vs(0),
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: ms(30),
    borderBottomRightRadius: ms(30),
    height: vs(100),
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hs(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(10),
  },
  backButton: {
    paddingRight: hs(18),
  },
  backIcon: {
    height: ms(21),
    width: ms(12),
    resizeMode: 'contain',
    tintColor: theme.colors.white,
  },
  completText: {
    ...typography._20PoppinsRegular,
    color: theme.colors.white,
  },
  profileBackImage: {
    height: vs(55),
    width: hs(55),
    resizeMode: 'contain',
    position: 'absolute',
    right: 0,
    bottom: 0,
    tintColor: hexToRGBA(theme.colors.Gainsboro, 0.6),
  },
});

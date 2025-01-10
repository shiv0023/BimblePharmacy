import React from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

const CustomText = ({ style, children, ...props }) => {
  const { text } = useTheme(); 
  return <Text style={[text, style]} {...props}>{children}</Text>;
};

export default CustomText;

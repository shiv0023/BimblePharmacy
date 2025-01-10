import React, { createContext, useContext, useEffect } from "react";
import { Text, TextInput, Button, Platform } from "react-native";

// Create ThemeContext
const ThemeContext = createContext();
{/* <string>Product Sans Bold Italic.ttf</string>
		<string>Product Sans Bold.ttf</string>
		<string>Product Sans Italic.ttf</string>
		<string>Product Sans Regular.ttf</string> */}
// ThemeProvider Component
export const ThemeProvider = ({ children }) => {
    // Define your theme settings here
    const theme = {
      text: {
        base: {
          fontFamily: "Product Sans",
          fontSize: 18,
          fontWeight: "400",
          lineHeight: 21.48,
          color: "#000000",
        },
        heading: {
          fontFamily: "Product Sans",
          fontSize: 30,
          fontWeight: "700",
          color: "#191919",
          lineHeight: 36.39,
        },
        subheading: {
          fontFamily: "Product Sans",
          fontSize: 20,
          fontWeight: "700",
          color: "#191919",
          lineHeight: 24.26,
        },
        placeholder: {
          fontFamily: "Product Sans Regular",
          fontSize: 15,
          fontWeight: "400",
          color: "#191919",
          lineHeight: 17.9,
        },
        accent: {
          fontFamily: "Product Sans",
          fontSize: 15,
          fontWeight: "400",
          color: "#191919",
        },
        paragraph: {
          fontFamily: "Product Sans",
          fontSize: 16,
          fontWeight: "400",
          lineHeight: 24,
          color: "#333333",
        },
        pageHeading: {
          fontFamily: "Product Sans",
          fontSize: 25,
          fontWeight: "700",
          color: "#ffffff",
          lineHeight: 24.82,
        },
      },
      button: {
        fontFamily: "Product Sans",
        fontSize: 18,
        fontWeight: "400",
        color: "#FFFFFF",
        backgroundColor: "#007BFF",
      },
      input: {
        fontFamily: "Product Sans",
        fontSize: 18,
        fontWeight: "400",
        color: "#000000",
        placeholderTextColor: "#888888",
      },
    
    };
  
    // Override default render behavior globally
    useEffect(() => {
      // Override Text
      const defaultTextRender = Text.render;
      Text.render = function (...args) {
        const element = defaultTextRender.apply(this, args);
        const variant = element.props.variant || "base"; // Default to base variant
        return React.cloneElement(element, {
          style: [theme.text[variant], element.props.style],
        });
      };
  
      // Override TextInput
      const defaultTextInputRender = TextInput.render;
      TextInput.render = function (...args) {
        const element = defaultTextInputRender.apply(this, args);
        return React.cloneElement(element, {
          style: [theme.input, element.props.style],
          placeholderTextColor: theme.input.placeholderTextColor, // Apply placeholder color
        });
      };
  
      // Override Button (for default buttons)
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const defaultButtonRender = Button.render;
        Button.render = function (...args) {
          const element = defaultButtonRender.apply(this, args);
          return React.cloneElement(element, {
            color: theme.button.backgroundColor, // For Button background color
          });
        };
      }
    }, [theme]);
  
    return (
      <ThemeContext.Provider value={theme}>
        {children}
      </ThemeContext.Provider>
    );
  };
  

// Custom hook to use the theme in components
export const useTheme = () => useContext(ThemeContext);

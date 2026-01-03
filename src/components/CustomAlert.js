import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// أيقونة الخطأ
const ErrorIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#ef4444" strokeWidth={2} />
    <Path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة النجاح
const SuccessIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#22c55e" strokeWidth={2} />
    <Path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة التحذير
const WarningIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#f59e0b" strokeWidth={2} />
    <Path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CustomAlert = ({ visible, type = 'error', title, message, onClose, buttons = [] }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#22c55e';
      case 'warning':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* الأيقونة */}
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>

          {/* العنوان */}
          <Text style={[styles.title, { color: getColor() }]}>{title}</Text>

          {/* الرسالة */}
          <Text style={styles.message}>{message}</Text>

          {/* الأزرار */}
          <View style={styles.buttonsContainer}>
            {buttons.length > 0 ? (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' ? styles.cancelButton : styles.confirmButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    } else {
                      onClose();
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' ? styles.cancelButtonText : styles.confirmButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, styles.singleButton]}
                onPress={onClose}
              >
                <Text style={styles.confirmButtonText}>حسناً</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
    color: '#666',
  },
});

export default CustomAlert;

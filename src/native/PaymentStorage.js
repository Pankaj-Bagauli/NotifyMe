import { NativeModules, Platform } from 'react-native';

const { PaymentStorage } = NativeModules;

const getPayments = async () => {
  if (Platform.OS !== 'android') {
    throw new Error('Payment storage is only supported on Android.');
  }

  if (!PaymentStorage) {
    throw new Error('PaymentStorage native module is not available.');
  }

  const records = await PaymentStorage.getPayments();

  return records.map(record => ({
    id: record.id,
    eventId: record.eventId,
    amountPaise: Math.round(record.amountPaise),
    sender: record.sender,
    receivedAt: Math.round(record.receivedAtMillis),
  }));
};

export default {
  getPayments,
};

const Booking = require('../models/Booking');

const autoUpdateCompletedBookings = async () => {
  try {
    const confirmedBookings = await Booking.find({ bookingStatus: 'confirmed' });
    const now = Date.now();
    const bulkOps = [];

    for (const booking of confirmedBookings) {
      if (!booking.bookingDate || !booking.endTime) continue;

      const bDate = booking.bookingDate;
      const dateStr = [bDate.getFullYear(), String(bDate.getMonth() + 1).padStart(2, '0'), String(bDate.getDate()).padStart(2, '0')].join('-');
      const bookingEndDateTimeStr = `${dateStr}T${booking.endTime}:00`;
      const bookingEndDateTime = new Date(bookingEndDateTimeStr);

      if (now >= bookingEndDateTime.getTime()) {
        bulkOps.push({
          updateOne: {
            filter: { _id: booking._id },
            update: { $set: { bookingStatus: 'completed' } }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Booking.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error('Error auto-updating completed bookings:', error);
  }
};

module.exports = autoUpdateCompletedBookings;

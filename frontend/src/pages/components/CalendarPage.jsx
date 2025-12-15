import React, { useEffect, useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon, 
} from "@heroicons/react/24/outline";

const isPastDay = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  return d < today;
};

export default function CalendarPage({ role = "meoadmin", onEventsUpdated }) {
  const axiosPrivate = useAxiosPrivate();
  const [events, setEvents] = useState([]);

  // Loading state to prevent double clicks/duplication
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar states
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });

  // FETCH EVENTS FROM BACKEND
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axiosPrivate.get("/api/events");
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    }
  };

  // MODAL HANDLERS
  const openNewForDate = (date) => {
    setEditing(null); 
    setForm({
      title: "",
      description: "",
      start: toInputDatetime(date),
      end: toInputDatetime(date),
      location: "",
    });
    setIsOpen(true);
  };

  const openEdit = (ev) => {
    setEditing(ev); 
    setForm({
      title: ev.title,
      description: ev.description,
      start: toInputDatetime(ev.start),
      end: toInputDatetime(ev.end),
      location: ev.location,
    });
    setIsOpen(true);
  };

  const toInputDatetime = (date) => {
    const dt = new Date(date);

    const localDate = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const fromInputDatetime = (s) => new Date(s);

  // --- SUBMIT EVENT (CREATE OR UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start || !form.end) return alert("Missing fields");


    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (editing) {
  
        const res = await axiosPrivate.put(`/api/events/${editing._id}`, {
          title: form.title,
          description: form.description,
          start: fromInputDatetime(form.start),
          end: fromInputDatetime(form.end),
          location: form.location,
        });

        const updatedEvents = events.map((ev) =>
          ev._id === editing._id ? res.data.event : ev
        );
        
        setEvents(updatedEvents);
        if (onEventsUpdated) onEventsUpdated(); 
      } else {

        const res = await axiosPrivate.post(`/api/events`, {
          title: form.title,
          description: form.description,
          start: fromInputDatetime(form.start),
          end: fromInputDatetime(form.end),
          location: form.location,
        });

        const newEvents = [...events, res.data.event];
        setEvents(newEvents);

        if (onEventsUpdated) onEventsUpdated();
      }

      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE EVENT ---
  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      setIsSubmitting(true);
      await axiosPrivate.delete(`/api/events/${editing._id}`);

 
      const filteredEvents = events.filter((x) => x._id !== editing._id);
      setEvents(filteredEvents);

      if (onEventsUpdated) onEventsUpdated();
      setIsOpen(false);

    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CALENDAR GRID HELPERS
  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    { month: "long" }
  );

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let grid = [];
  for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);

  const nextMonth = () => {
    setCurrentMonth((m) => (m === 11 ? 0 : m + 1));
    if (currentMonth === 11) setCurrentYear((y) => y + 1);
  };

  const prevMonth = () => {
    setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
    if (currentMonth === 0) setCurrentYear((y) => y - 1);
  };

  const getEventsForDay = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return events.filter(
      (ev) => new Date(ev.start).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="p-4">
      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-6">
        {(role === "meoadmin" ||
          role === "bfpadmin" ||
          role === "mayoradmin") && (
          <button
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 transition"
            onClick={() => openNewForDate(new Date())}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Schedule
          </button>
        )}
      </div>

      {/* MONTH HEADER */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <button
          className="flex items-center bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition"
          onClick={prevMonth}
        >
          <ChevronLeftIcon className="w-5 h-5 text-blue-600" />
          <span className="ml-1 text-blue-700 font-medium">Previous</span>
        </button>

        <h2 className="text-xl font-bold text-gray-800">
          {monthName} {currentYear}
        </h2>

        <button
          className="flex items-center bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition"
          onClick={nextMonth}
        >
          <span className="mr-1 text-blue-700 font-medium">Next</span>
          <ChevronRightIcon className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold mb-2 text-sm uppercase tracking-wide">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {grid.map((day, idx) => {
          const dateObj = day ? new Date(currentYear, currentMonth, day) : null;
          const disabled = day && isPastDay(dateObj);
          const isToday =
            day && dateObj.toDateString() === today.toDateString();
          const dayEvents = day ? getEventsForDay(day) : [];

          return (
            <div
              key={idx}
              className={`min-h-[100px] border p-2 rounded transition-colors relative overflow-hidden
                ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-100"}
                ${disabled ? "past-time-slot bg-gray-50" : "hover:bg-gray-50 cursor-pointer"}
              `}
              onClick={() => {
                if (!disabled && day) {
                  openNewForDate(dateObj);
                }
              }}
            >
              <span className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                {day || ""}
              </span>

              {/* Event Pills */}
              <div className="mt-1 space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="text-xs px-2 py-1 rounded bg-blue-600 text-white truncate shadow-sm hover:bg-blue-700 transition cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) openEdit(ev);
                    }}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all"
          >
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Event" : "Create New Event"}
              </h2>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Meeting title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Address or venue"
                />
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              
              {/* DELETE BUTTON */}
              <div>
                {editing && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="flex items-center text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-md transition"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="w-5 h-5 mr-1" />
                    Delete
                  </button>
                )}
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md shadow transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isSubmitting ? "Saving..." : editing ? "Update Changes" : "Create Event"}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
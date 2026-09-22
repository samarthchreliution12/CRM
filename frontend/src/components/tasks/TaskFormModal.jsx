import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import TaskService from "../../services/task.service";
import ClientService from "../../services/client.service";
import LeadService from "../../services/lead.service";
import StaffService from "../../services/staff.service";
import useAuth from "../../hooks/useAuth";
import { formatTaskDate, isPastTaskDate } from "../../utils/taskDate";

const TASK_TYPES = [
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const REMINDERS = [
  { value: "NONE", label: "None" },
  { value: "15_MIN", label: "15 Minutes Before" },
  { value: "30_MIN", label: "30 Minutes Before" },
  { value: "1_HOUR", label: "1 Hour Before" },
  { value: "1_DAY", label: "1 Day Before" },
];

const TaskFormModal = ({
  task = null,
  taskToEdit = null,
  isOpen = true,
  onClose,
  onSubmit,
  onSuccess,
  clients = [],
  leads = [],
  staffUsers = [],
  initialDueDate = "",
  initialDueTime = "",
}) => {
  const { token, user } = useAuth();
  const targetTask = task || taskToEdit;
  const isEditMode = Boolean(targetTask);

  // Form Field State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_type: "FOLLOW_UP",
    related_to_type: "NONE", // 'NONE' | 'CLIENT' | 'LEAD'
    related_client_id: "",
    related_lead_id: "",
    assigned_to: "",
    priority: "MEDIUM",
    status: "PENDING",
    due_date: "",
    due_time: "",
    reminder: "NONE",
  });

  // Options State
  const [clientsOptions, setClientsOptions] = useState(clients);
  const [leadsOptions, setLeadsOptions] = useState(leads);
  const [staffOptions, setStaffOptions] = useState(staffUsers);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Validation State
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

const extractList = (res, key) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
    if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
  }
  if (res[key] && Array.isArray(res[key])) return res[key];
  return [];
};

  // Sync options if passed as props
  useEffect(() => {
    if (clients && clients.length > 0) setClientsOptions(clients);
    if (leads && leads.length > 0) setLeadsOptions(leads);
    if (staffUsers && staffUsers.length > 0) setStaffOptions(staffUsers);
  }, [clients, leads, staffUsers]);

  // Always fetch reference options on modal mount
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [clientsRes, leadsRes, staffRes] = await Promise.all([
          ClientService.getClients({ limit: 100 }, token).catch(() => null),
          LeadService.getLeads({ limit: 100 }, token).catch(() => null),
          StaffService.getStaffUsers({ limit: 100 }, token).catch(() => null),
        ]);

        if (isMounted) {
          const cList = extractList(clientsRes, "clients");
          const lList = extractList(leadsRes, "leads");
          const sList = extractList(staffRes, "staff");

          if (cList.length > 0) setClientsOptions(cList);
          if (lList.length > 0) setLeadsOptions(lList);
          if (sList.length > 0) {
            let list = [...sList];
            if (user && !list.some((s) => String(s.id) === String(user.id))) {
              list.unshift({ id: user.id, name: user.name || user.email || "Current User" });
            }
            setStaffOptions(list);
          }
        }
      } catch (e) {
        // non-blocking
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [token, user]);

  // Pre-fill form when editing or resetting
  useEffect(() => {
    if (targetTask) {
      let relType = "NONE";
      if (targetTask.related_client_id || targetTask.client_id) relType = "CLIENT";
      else if (targetTask.related_lead_id || targetTask.lead_id) relType = "LEAD";

      const clientVal = targetTask.related_client_id || targetTask.client_id;
      const leadVal = targetTask.related_lead_id || targetTask.lead_id;
      const assignedVal = targetTask.assigned_to || (targetTask.assigned_to_user ? targetTask.assigned_to_user.id : "");

      // Extract date string YYYY-MM-DD from due_date
      let dueDateStr = "";
      if (targetTask.due_date) {
        dueDateStr = String(targetTask.due_date).split("T")[0];
      }

      setFormData({
        title: targetTask.title || "",
        description: targetTask.description || "",
        task_type: targetTask.task_type || "FOLLOW_UP",
        related_to_type: relType,
        related_client_id: clientVal ? String(clientVal) : "",
        related_lead_id: leadVal ? String(leadVal) : "",
        assigned_to: assignedVal ? String(assignedVal) : "",
        priority: targetTask.priority || "MEDIUM",
        status: targetTask.status || "PENDING",
        due_date: dueDateStr,
        due_time: targetTask.due_time || "",
        reminder: targetTask.reminder || "NONE",
      });
    } else {
      const todayStr = formatTaskDate();
      setFormData({
        title: "",
        description: "",
        task_type: "FOLLOW_UP",
        related_to_type: "NONE",
        related_client_id: "",
        related_lead_id: "",
        assigned_to: user ? String(user.id) : "",
        priority: "MEDIUM",
        status: "PENDING",
        due_date: initialDueDate || todayStr,
        due_time: initialDueTime || "10:00",
        reminder: "NONE",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [targetTask, user, initialDueDate, initialDueTime]);

  // Ensure default assigned_to is set to current logged-in user when creating a new task
  useEffect(() => {
    if (!targetTask && user?.id && !formData.assigned_to) {
      setFormData((prev) => ({ ...prev, assigned_to: String(user.id) }));
    }
  }, [user, targetTask, formData.assigned_to]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRelatedTypeChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      related_to_type: val,
      related_client_id: val === "CLIENT" ? prev.related_client_id : "",
      related_lead_id: val === "LEAD" ? prev.related_lead_id : "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task Title is required.";
    }

    if (!formData.task_type) {
      newErrors.task_type = "Task Type is required.";
    }

    if (!formData.assigned_to) {
      newErrors.assigned_to = "Assigned To is required.";
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required.";
    }

    if (!formData.due_date) {
      newErrors.due_date = "Due Date is required.";
    }

    if (formData.related_to_type === "CLIENT" && !formData.related_client_id) {
      newErrors.related_client_id = "Please select a Client.";
    }

    if (formData.related_to_type === "LEAD" && !formData.related_lead_id) {
      newErrors.related_lead_id = "Please select a Lead.";
    }

    if (!isEditMode && formData.due_date && isPastTaskDate(formData.due_date)) {
      newErrors.due_date = "Tasks cannot be created for past dates. Choose today or a future date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      task_type: formData.task_type,
      priority: formData.priority,
      status: formData.status,
      due_date: formData.due_date,
      due_time: formData.due_time || null,
      reminder: formData.reminder || "NONE",
      assigned_to: parseInt(formData.assigned_to, 10),
      related_client_id:
        formData.related_to_type === "CLIENT" && formData.related_client_id
          ? parseInt(formData.related_client_id, 10)
          : null,
      related_lead_id:
        formData.related_to_type === "LEAD" && formData.related_lead_id
          ? parseInt(formData.related_lead_id, 10)
          : null,
    };

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        if (isEditMode) {
          await TaskService.updateTask(targetTask.id, payload, token);
        } else {
          await TaskService.createTask(payload, token);
        }
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: "620px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #25282A)" }}>
            {isEditMode ? "Edit Task" : "Create Task"}
          </h3>
          <button type="button" className="btn-close-modal" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {submitError && (
              <div className="banner-error" style={{ marginBottom: "1rem" }}>
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Task Title */}
            <div className="form-group">
              <label className="form-label">
                Task Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Follow up on proposal documents"
                className={`form-input ${errors.title ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.title && <span className="form-error-text">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add optional task details or agenda..."
                rows={3}
                className="form-textarea"
                disabled={isSubmitting}
              />
            </div>

            {/* Task Type Checkboxes */}
            <div className="form-group">
              <label className="form-label">
                Task Type <span className="required">*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.25rem" }}>
                {TASK_TYPES.map((t) => (
                  <label
                    key={t.value}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#334155",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="task_type"
                      value={t.value}
                      checked={formData.task_type === t.value}
                      onChange={() => {
                        setFormData((prev) => ({ ...prev, task_type: t.value }));
                        if (errors.task_type) setErrors((prev) => ({ ...prev, task_type: "" }));
                      }}
                      disabled={isSubmitting}
                      style={{ cursor: isSubmitting ? "not-allowed" : "pointer" }}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
              {errors.task_type && <span className="form-error-text">{errors.task_type}</span>}
            </div>

            {/* Priority Checkboxes */}
            <div className="form-group">
              <label className="form-label">
                Priority <span className="required">*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginTop: "0.25rem" }}>
                {PRIORITIES.map((p) => (
                  <label
                    key={p.value}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#334155",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="priority"
                      value={p.value}
                      checked={formData.priority === p.value}
                      onChange={() => {
                        setFormData((prev) => ({ ...prev, priority: p.value }));
                        if (errors.priority) setErrors((prev) => ({ ...prev, priority: "" }));
                      }}
                      disabled={isSubmitting}
                      style={{ cursor: isSubmitting ? "not-allowed" : "pointer" }}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
              {errors.priority && <span className="form-error-text">{errors.priority}</span>}
            </div>

            {/* Related To Selector (Mutually Exclusive Client/Lead) */}
            <div
              className="form-group"
              style={{
                backgroundColor: "#FAF9F8",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--border, #E2E2DF)",
              }}
            >
              <label className="form-label" style={{ marginBottom: "0.5rem", fontWeight: 700 }}>
                Related To
              </label>
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="related_to_type"
                    value="NONE"
                    checked={formData.related_to_type === "NONE"}
                    onChange={handleRelatedTypeChange}
                    disabled={isSubmitting}
                    style={{ accentColor: "var(--primary, #9E241D)" }}
                  />
                  <span>None</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="related_to_type"
                    value="CLIENT"
                    checked={formData.related_to_type === "CLIENT"}
                    onChange={handleRelatedTypeChange}
                    disabled={isSubmitting}
                    style={{ accentColor: "var(--primary, #9E241D)" }}
                  />
                  <span>Client</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="related_to_type"
                    value="LEAD"
                    checked={formData.related_to_type === "LEAD"}
                    onChange={handleRelatedTypeChange}
                    disabled={isSubmitting}
                    style={{ accentColor: "var(--primary, #9E241D)" }}
                  />
                  <span>Lead</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="related_to_type"
                    value="OTHER"
                    checked={formData.related_to_type === "OTHER"}
                    onChange={handleRelatedTypeChange}
                    disabled={isSubmitting}
                    style={{ accentColor: "var(--primary, #9E241D)" }}
                  />
                  <span>Other</span>
                </label>
              </div>

              {formData.related_to_type === "CLIENT" && (
                <div>
                  <select
                    name="related_client_id"
                    value={formData.related_client_id}
                    onChange={handleChange}
                    className={`form-select ${errors.related_client_id ? "error" : ""}`}
                    disabled={isSubmitting || loadingOptions}
                  >
                    <option value="">-- Select Client --</option>
                    {clientsOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || c.name} {c.ucc_no ? `(${c.ucc_no})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.related_client_id && <span className="form-error-text">{errors.related_client_id}</span>}
                </div>
              )}

              {formData.related_to_type === "LEAD" && (
                <div>
                  <select
                    name="related_lead_id"
                    value={formData.related_lead_id}
                    onChange={handleChange}
                    className={`form-select ${errors.related_lead_id ? "error" : ""}`}
                    disabled={isSubmitting || loadingOptions}
                  >
                    <option value="">-- Select Lead --</option>
                    {leadsOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name || l.name} {l.company_name ? `(${l.company_name})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.related_lead_id && <span className="form-error-text">{errors.related_lead_id}</span>}
                </div>
              )}
            </div>

            {/* Grid Row 2: Assigned To & Status */}
            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">
                  Assigned To <span className="required">*</span>
                </label>
                <select
                  name="assigned_to"
                  value={String(formData.assigned_to)}
                  onChange={handleChange}
                  className={`form-select ${errors.assigned_to ? "error" : ""}`}
                  disabled={isSubmitting || loadingOptions}
                >
                  <option value="">-- Select User --</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.full_name || s.name || s.email} {String(s.id) === String(user?.id) ? " (You)" : ""}
                    </option>
                  ))}
                </select>
                {errors.assigned_to && <span className="form-error-text">{errors.assigned_to}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Status <span className="required">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid Row 3: Due Date, Due Time, Reminder */}
            <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">
                  Due Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  min={isEditMode ? undefined : formatTaskDate()}
                  value={formData.due_date}
                  onChange={handleChange}
                  className={`form-input ${errors.due_date ? "error" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.due_date && <span className="form-error-text">{errors.due_date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Due Time</label>
                <input
                  type="time"
                  name="due_time"
                  value={formData.due_time}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reminder</label>
                <select
                  name="reminder"
                  value={formData.reminder}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  {REMINDERS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-add-task"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--primary, #9E241D)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Task" : "Create Task"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;

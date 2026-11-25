import React, { useEffect, useState } from "react";
import { useToast } from "../../components/useToast";
import {
  getEmployeeSecurityAccessLists,
  saveEmployeeSecurityAccess,
} from "../../services/securityMasterService";
import "../../style/SecurityMaster.css";

const SecurityMaster = ({ open, onClose, employee }) => {
  const { showToast } = useToast();
  const [rules, setRules] = useState([]);
  const [appliedRules, setAppliedRules] = useState([]);
  // Deprecated aggregate expansion map (replaced by expandedGroupsNotApplied / expandedGroupsApplied)
  // const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedGroupsNotApplied, setExpandedGroupsNotApplied] = useState({});
  const [expandedGroupsApplied, setExpandedGroupsApplied] = useState({});
  const [selectedRulesNotApplied, setSelectedRulesNotApplied] = useState({}); // Store selected rule IDs for Not Applied panel
  const [selectedGroupsNotApplied, setSelectedGroupsNotApplied] = useState({}); // Store group selection state for Not Applied panel
  const [selectedRulesApplied, setSelectedRulesApplied] = useState({}); // Store selected rule IDs for Applied panel
  const [selectedGroupsApplied, setSelectedGroupsApplied] = useState({}); // Store group selection state for Applied panel
  const [isOverNotApplied, setIsOverNotApplied] = useState(false);
  const [isOverApplied, setIsOverApplied] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const moveToApplied = () => {
    // Check if entire groups are selected
    const selectedGroupsList = Object.entries(selectedGroupsNotApplied)
      .filter(([, isSelected]) => isSelected)
      .map(([groupName]) => groupName);

    // Check for individually selected rules
    const selectedRulesList = Object.entries(selectedRulesNotApplied)
      .filter(([, isSelected]) => isSelected)
      .map(([ruleId]) => ruleId);

    const rulesToMove = [];
    const groupsToRemove = new Set();

    // Handle selected groups first
    selectedGroupsList.forEach((groupName) => {
      if (rules[groupName]) {
        const groupRules = rules[groupName].map((rule) => ({
          ...rule,
          screen_name: groupName, // Ensure screen_name is set to group name
        }));
        rulesToMove.push(...groupRules);
        groupsToRemove.add(groupName);
      }
    });

    // Handle individually selected rules (only for groups that are not already selected)
    Object.entries(rules).forEach(([groupName, groupRules]) => {
      // Skip if this group is already being moved as a whole
      if (groupsToRemove.has(groupName)) {
        return;
      }

      const selectedRulesInGroup = groupRules.filter((rule) =>
        selectedRulesList.includes(rule.rule_id.toString())
      );

      if (selectedRulesInGroup.length > 0) {
        const rulesWithGroupName = selectedRulesInGroup.map((rule) => ({
          ...rule,
          screen_name: groupName, // Ensure screen_name is set to group name
        }));
        rulesToMove.push(...rulesWithGroupName);

        // If all rules in group are selected, remove the entire group
        if (selectedRulesInGroup.length === groupRules.length) {
          groupsToRemove.add(groupName);
        }
      }
    });

    // Update applied rules - avoid duplicates
    setAppliedRules((prev) => {
      const existingRuleIds = new Set(prev.map((rule) => rule.rule_id));
      const newRules = rulesToMove.filter(
        (rule) => !existingRuleIds.has(rule.rule_id)
      );
      return [...prev, ...newRules];
    });

    // Remove moved rules/groups from rules state
    const newRules = { ...rules };
    groupsToRemove.forEach((groupName) => {
      delete newRules[groupName];
    });

    // Remove individually selected rules from remaining groups
    Object.entries(newRules).forEach(([groupName, groupRules]) => {
      if (!groupsToRemove.has(groupName)) {
        newRules[groupName] = groupRules.filter(
          (rule) => !selectedRulesList.includes(rule.rule_id.toString())
        );
        // If group is now empty, remove it
        if (newRules[groupName].length === 0) {
          delete newRules[groupName];
        }
      }
    });

    setRules(newRules);
    setSelectedRulesNotApplied({});
    setSelectedGroupsNotApplied({});
    setSelectedRulesApplied({});
    setSelectedGroupsApplied({});
  };

  const moveToNotApplied = () => {
    // Check if entire groups are selected
    const selectedGroupsList = Object.entries(selectedGroupsApplied)
      .filter(([, isSelected]) => isSelected)
      .map(([groupName]) => groupName);

    // Check for individually selected rules
    const selectedRulesList = Object.entries(selectedRulesApplied)
      .filter(([, isSelected]) => isSelected)
      .map(([ruleId]) => ruleId);

    // Group applied rules by screen_name
    const appliedRulesByGroup = appliedRules.reduce((acc, rule) => {
      const groupName = rule.screen_name || "Other";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(rule);
      return acc;
    }, {});

    const rulesToMove = [];
    const groupsToRemove = new Set();

    // Handle selected groups first
    selectedGroupsList.forEach((groupName) => {
      if (appliedRulesByGroup[groupName]) {
        rulesToMove.push(...appliedRulesByGroup[groupName]);
        groupsToRemove.add(groupName);
      }
    });

    // Handle individually selected rules (only for groups that are not already selected)
    Object.entries(appliedRulesByGroup).forEach(([groupName, groupRules]) => {
      // Skip if this group is already being moved as a whole
      if (groupsToRemove.has(groupName)) {
        return;
      }

      const selectedRulesInGroup = groupRules.filter((rule) =>
        selectedRulesList.includes(rule.rule_id.toString())
      );

      if (selectedRulesInGroup.length > 0) {
        rulesToMove.push(...selectedRulesInGroup);

        // If all rules in group are selected, mark group for removal
        if (selectedRulesInGroup.length === groupRules.length) {
          groupsToRemove.add(groupName);
        }
      }
    });

    // Add rules back to "Not Applied" - avoid duplicates
    const newRules = { ...rules };
    rulesToMove.forEach((rule) => {
      const groupName = rule.screen_name || "Other";
      if (!newRules[groupName]) {
        newRules[groupName] = [];
      }
      // Check if rule already exists in this group
      const existingRuleIds = new Set(
        newRules[groupName].map((r) => r.rule_id)
      );
      if (!existingRuleIds.has(rule.rule_id)) {
        newRules[groupName].push({
          ...rule,
          screen_name: groupName, // Ensure screen_name is properly set
        });
      }
    });
    setRules(newRules);

    // Remove from applied rules
    setAppliedRules((prev) => {
      const remainingRules = prev.filter((rule) => {
        // Keep rule if its group isn't being removed entirely and rule isn't individually selected
        return (
          !groupsToRemove.has(rule.screen_name) &&
          !selectedRulesList.includes(rule.rule_id.toString())
        );
      });
      return remainingRules;
    });

    // Clear selections
    setSelectedRulesNotApplied({});
    setSelectedGroupsNotApplied({});
    setSelectedRulesApplied({});
    setSelectedGroupsApplied({});
  };

  // Drag-and-drop helpers
  const moveGroupToApplied = (groupName) => {
    if (!rules[groupName]) return;
    const groupRules = rules[groupName].map((rule) => ({
      ...rule,
      screen_name: groupName,
    }));
    setAppliedRules((prev) => {
      const existing = new Set(prev.map((r) => r.rule_id));
      const newOnes = groupRules.filter((r) => !existing.has(r.rule_id));
      return [...prev, ...newOnes];
    });
    const newRules = { ...rules };
    delete newRules[groupName];
    setRules(newRules);
    // Preserve expansion state when moving group (exact state)
    const wasExpanded = expandedGroupsNotApplied[groupName];
    setExpandedGroupsApplied((prev) => ({
      ...prev,
      [groupName]: !!wasExpanded,
    }));
  };

  const moveRuleToApplied = (groupName, ruleId) => {
    const groupRules = rules[groupName] || [];
    const rule = groupRules.find((r) => r.rule_id === ruleId);
    if (!rule) return;
    setAppliedRules((prev) => {
      const exists = prev.some((r) => r.rule_id === ruleId);
      return exists ? prev : [...prev, { ...rule, screen_name: groupName }];
    });
    const remaining = groupRules.filter((r) => r.rule_id !== ruleId);
    const newRules = { ...rules };
    if (remaining.length === 0) delete newRules[groupName];
    else newRules[groupName] = remaining;
    setRules(newRules);
    // If this was the last rule in the group, carry over exact expansion state
    if (remaining.length === 0) {
      const wasExpanded = !!expandedGroupsNotApplied[groupName];
      setExpandedGroupsApplied((prev) => ({
        ...prev,
        [groupName]: wasExpanded,
      }));
    }
  };

  const moveGroupToNotApplied = (groupName) => {
    const byGroup = appliedRules.reduce((acc, r) => {
      const g = r.screen_name || "Other";
      if (!acc[g]) acc[g] = [];
      acc[g].push(r);
      return acc;
    }, {});
    const group = byGroup[groupName] || [];
    if (group.length === 0) return;
    const newRules = { ...rules };
    if (!newRules[groupName]) newRules[groupName] = [];
    const existingIds = new Set(newRules[groupName].map((r) => r.rule_id));
    group.forEach((r) => {
      if (!existingIds.has(r.rule_id))
        newRules[groupName].push({ ...r, screen_name: groupName });
    });
    setRules(newRules);
    setAppliedRules((prev) => prev.filter((r) => r.screen_name !== groupName));
    // Preserve expansion state when moving group (exact state)
    const wasExpanded = expandedGroupsApplied[groupName];
    setExpandedGroupsNotApplied((prev) => ({
      ...prev,
      [groupName]: !!wasExpanded,
    }));
  };

  const moveRuleToNotApplied = (groupName, ruleId) => {
    const rule = appliedRules.find((r) => r.rule_id === ruleId);
    if (!rule) return;
    const newRules = { ...rules };
    if (!newRules[groupName]) newRules[groupName] = [];
    const exists = newRules[groupName].some((r) => r.rule_id === ruleId);
    if (!exists) newRules[groupName].push({ ...rule, screen_name: groupName });
    setRules(newRules);
    setAppliedRules((prev) => prev.filter((r) => r.rule_id !== ruleId));
    // If this was the last rule in the group, carry over exact expansion state
    const remainingInApplied = appliedRules.filter(
      (r) => r.screen_name === groupName && r.rule_id !== ruleId
    );
    if (remainingInApplied.length === 0) {
      const wasExpanded = !!expandedGroupsApplied[groupName];
      setExpandedGroupsNotApplied((prev) => ({
        ...prev,
        [groupName]: wasExpanded,
      }));
    }
  };

  const handleDragStart = (event, payload) => {
    try {
      event.dataTransfer.setData("application/json", JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "move";
      // Add global drag end listener
      const handleGlobalDragEnd = () => {
        setIsOverApplied(false);
        setIsOverNotApplied(false);
        // Only close modal if drag was cancelled (dragged outside drop zones)
        // Don't close modal on successful drops
        document.removeEventListener("dragend", handleGlobalDragEnd);
      };
      document.addEventListener("dragend", handleGlobalDragEnd);
    } catch (error) {
      void error;
    }
  };

  const allowDrop = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleEnterApplied = (event) => {
    allowDrop(event);
    setIsOverApplied(true);
  };
  const handleEnterNotApplied = (event) => {
    allowDrop(event);
    setIsOverNotApplied(true);
  };

  const handleDropOnApplied = (event) => {
    event.preventDefault();
    const text = event.dataTransfer.getData("application/json");
    if (!text) return;
    const data = JSON.parse(text);
    if (data.from !== "notApplied") return;
    if (data.kind === "group") moveGroupToApplied(data.screenName);
    if (data.kind === "rule") moveRuleToApplied(data.screenName, data.ruleId);
    setIsOverApplied(false);
    setIsOverNotApplied(false);
    // Prevent modal from closing on successful drop
    event.stopPropagation();
  };

  const handleDropOnNotApplied = (event) => {
    event.preventDefault();
    const text = event.dataTransfer.getData("application/json");
    if (!text) return;
    const data = JSON.parse(text);
    if (data.from !== "applied") return;
    if (data.kind === "group") moveGroupToNotApplied(data.screenName);
    if (data.kind === "rule")
      moveRuleToNotApplied(data.screenName, data.ruleId);
    setIsOverNotApplied(false);
    setIsOverApplied(false);
    // Prevent modal from closing on successful drop
    event.stopPropagation();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all available rules + assigned rules via service
        const { allRulesResponse, assignedRulesResponse } =
          await getEmployeeSecurityAccessLists(employee?.empl_auto_id);

        // Fetch all available rules
        if (allRulesResponse.data?.data?.EMPLOYEE_SECURITY_ACCESS_LIST) {
          const allRulesData =
            allRulesResponse.data.data.EMPLOYEE_SECURITY_ACCESS_LIST;

          // Get applied rule IDs to filter them out from "Not Applied" section
          let appliedRuleIds = new Set();
          if (
            assignedRulesResponse.data?.data
              ?.ASSIGNED_EMPLOYEE_SECURITY_ACCESS_LIST
          ) {
            const assignedRulesData =
              assignedRulesResponse.data.data
                .ASSIGNED_EMPLOYEE_SECURITY_ACCESS_LIST;
            // Remove duplicates and get unique rule IDs
            const uniqueAssignedRules = assignedRulesData.filter(
              (rule, index, self) =>
                index === self.findIndex((r) => r.rule_id === rule.rule_id)
            );
            appliedRuleIds = new Set(
              uniqueAssignedRules.map((rule) => rule.rule_id)
            );
          }

          // Filter out already applied rules from all rules
          const filteredRules = allRulesData.filter(
            (rule) => !appliedRuleIds.has(rule.rule_id)
          );

          const groupedRules = filteredRules.reduce((acc, rule) => {
            const screenName = rule.screen_name || "Other";
            if (!acc[screenName]) {
              acc[screenName] = [];
            }
            acc[screenName].push({
              rule_id: rule.rule_id,
              rule_name: rule.rule_name,
              dept_id: rule.dept_id,
              default_access: rule.default_access,
              screen_name: rule.screen_name,
            });
            return acc;
          }, {});

          console.log("All Available Rules:", groupedRules);
          setRules(groupedRules);

          // Initialize expanded state for all groups
          const initialExpandedState = Object.keys(groupedRules).reduce(
            (acc, screenName) => {
              acc[screenName] = true; // Set to true to show expanded by default
              return acc;
            },
            {}
          );
          setExpandedGroupsNotApplied(initialExpandedState);
        }

        // Process assigned rules
        if (
          assignedRulesResponse.data?.data
            ?.ASSIGNED_EMPLOYEE_SECURITY_ACCESS_LIST
        ) {
          const assignedRulesData =
            assignedRulesResponse.data.data
              .ASSIGNED_EMPLOYEE_SECURITY_ACCESS_LIST;

          // Remove duplicates from assigned rules data first
          const uniqueAssignedRules = assignedRulesData.filter(
            (rule, index, self) =>
              index === self.findIndex((r) => r.rule_id === rule.rule_id)
          );

          // Group assigned rules by screen_name
          const groupedAssignedRules = uniqueAssignedRules.reduce(
            (acc, assignedRule) => {
              // Find the corresponding rule from all rules to get screen_name
              const matchingRule =
                allRulesResponse.data?.data?.EMPLOYEE_SECURITY_ACCESS_LIST?.find(
                  (rule) => rule.rule_id === assignedRule.rule_id
                );

              const screenName = matchingRule?.screen_name || "Other";
              if (!acc[screenName]) {
                acc[screenName] = [];
              }

              acc[screenName].push({
                rule_id: assignedRule.rule_id,
                rule_name: assignedRule.rule_name,
                dept_id: matchingRule?.dept_id,
                default_access: matchingRule?.default_access,
                screen_name: screenName,
                security_id: assignedRule.security_id,
                empl_auto_id: assignedRule.empl_auto_id,
                login_id: assignedRule.login_id,
                empl_name: assignedRule.empl_name,
              });
              return acc;
            },
            {}
          );

          console.log("Assigned Rules:", groupedAssignedRules);
          setAppliedRules(Object.values(groupedAssignedRules).flat());
          // Initialize expanded state for all applied groups to expanded by default
          const initialAppliedExpanded = Object.keys(
            groupedAssignedRules
          ).reduce((acc, name) => {
            acc[name] = true;
            return acc;
          }, {});
          setExpandedGroupsApplied(initialAppliedExpanded);
        }
      } catch (error) {
        console.error("Error fetching security rules:", error);
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          // showToast("Failed to fetch rules", "error");
        }
      }
    };

    if (open && employee) {
      fetchData();
    }
  }, [open, employee, showToast]);

  const toggleGroupNotApplied = (screenName) => {
    setExpandedGroupsNotApplied((prev) => ({
      ...prev,
      [screenName]: !prev[screenName],
    }));
  };

  const toggleGroupApplied = (screenName) => {
    setExpandedGroupsApplied((prev) => ({
      ...prev,
      [screenName]: !prev[screenName],
    }));
  };

  // Handle group checkbox selection
  const handleGroupSelect = (screenName, screenRules, panel) => {
    const isGroupSelected =
      panel === "notApplied"
        ? selectedGroupsNotApplied[screenName]
        : selectedGroupsApplied[screenName];

    // Toggle group selection
    if (panel === "notApplied") {
      setSelectedGroupsNotApplied((prev) => ({
        ...prev,
        [screenName]: !isGroupSelected,
      }));
    } else {
      setSelectedGroupsApplied((prev) => ({
        ...prev,
        [screenName]: !isGroupSelected,
      }));
    }

    // Select/deselect all rules in the group
    const newSelectedRules =
      panel === "notApplied"
        ? { ...selectedRulesNotApplied }
        : { ...selectedRulesApplied };
    screenRules.forEach((rule) => {
      newSelectedRules[rule.rule_id] = !isGroupSelected;
    });
    if (panel === "notApplied") {
      setSelectedRulesNotApplied(newSelectedRules);
    } else {
      setSelectedRulesApplied(newSelectedRules);
    }
  };

  // Handle individual rule selection
  const handleRuleSelect = (ruleId, screenName, screenRules, panel) => {
    // Toggle rule selection
    const newSelectedRules =
      panel === "notApplied"
        ? {
            ...selectedRulesNotApplied,
            [ruleId]: !selectedRulesNotApplied[ruleId],
          }
        : {
            ...selectedRulesApplied,
            [ruleId]: !selectedRulesApplied[ruleId],
          };

    if (panel === "notApplied") {
      setSelectedRulesNotApplied(newSelectedRules);
    } else {
      setSelectedRulesApplied(newSelectedRules);
    }

    // Check if all rules in group are selected
    const allRulesSelected = screenRules.every(
      (rule) => newSelectedRules[rule.rule_id]
    );
    if (panel === "notApplied") {
      setSelectedGroupsNotApplied((prev) => ({
        ...prev,
        [screenName]: allRulesSelected,
      }));
    } else {
      setSelectedGroupsApplied((prev) => ({
        ...prev,
        [screenName]: allRulesSelected,
      }));
    }
  };

  const handleSave = async () => {
    try {
      // Get logged-in user data from localStorage
      console.log("All localStorage keys:", Object.keys(localStorage));
      console.log(
        "empl_name from localStorage:",
        localStorage.getItem("empl_name")
      );

      // Get empl_name directly from localStorage since it's stored as a direct key
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const preparedBy = user.empl_name || "";

      console.log("Final preparedBy value:", preparedBy);

      // Prepare request body
      const employeeId = employee?.empl_auto_id ?? 0;

      const employeeSecurityAccess = appliedRules.map((rule) => ({
        securityID: rule.security_id || 0,
        employeeID: employeeId,
        ruleID: rule.rule_id,
        preparedBy: preparedBy,
        paramType: rule.security_id ? "Update" : "Insert",
      }));

      const requestBody = {
        employeeID: employeeId,
        employeeSecurityAccess,
      };

      console.log("Save request body:", requestBody);

      const data = await saveEmployeeSecurityAccess(requestBody);

      console.log("Save response:", data);

      if (data?.Status === "Success") {
        showToast("Security access saved successfully", "success");
        if (typeof onClose === "function") {
          onClose();
        }
      } else {
        showToast("Failed to save security access", "error");
      }
    } catch (error) {
      console.error("Error saving security access:", error);
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        showToast("Failed to save security access", "error");
      }
    }
  };

  // Ensure any newly-added applied groups default to expanded
  useEffect(() => {
    const groups = appliedRules.reduce((acc, r) => {
      const name = r.screen_name || "Other";
      acc.add(name);
      return acc;
    }, new Set());
    setExpandedGroupsApplied((prev) => {
      const next = { ...prev };
      groups.forEach((name) => {
        if (typeof next[name] === "undefined") next[name] = true;
      });
      return next;
    });
  }, [appliedRules]);

  if (!open) return null;

  const modalClassName = `security-master-modal${
    isMobile ? " security-master-modal--mobile" : ""
  }`;
  const arrowsContainerClassName = `security-master-arrows${
    isMobile ? " security-master-arrows--mobile" : ""
  }`;
  const notAppliedBodyClassName = `card-body security-master-panel-body${
    isOverNotApplied ? " security-master-dropzone--active" : ""
  }`;
  const appliedBodyClassName = `card-body security-master-panel-body${
    isOverApplied ? " security-master-dropzone--active" : ""
  }`;

  return (
    <div className="security-master-overlay">
      <div className={modalClassName}>
        {/* Header */}
        <div className="security-master-header">
          <div className="security-master-header-left">
            <svg
              className="security-master-header-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="security-master-header-text">
              <h5 className="security-master-title">Security Master</h5>
            </div>
          </div>
          <div className="security-master-header-actions">
            <button
              className="btn btn-sm security-master-action-button"
              onClick={handleSave}
              title="Save"
              style={{
                background: "rgb(122, 75, 120)",
                color: "#fff",
                borderRadius: "8px",
                width: 33,
                height: 33,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                border: "none",
              }}
              type="button"
            >
              {/* Floppy disk SVG icon - same as RightDrawer */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            </button>
            <button
              className="btn btn-secondary btn-sm security-master-action-button"
              onClick={() => {
                if (typeof onClose === "function") {
                  onClose();
                }
              }}
              title="Close"
              type="button"
            >
              {/* X SVG icon - same as RightDrawer */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="security-master-body">
          <div className="g-3 security-master-grid">
            {/* Left Panel */}
            <div className="security-master-panel-container">
              <div className="card shadow-sm security-master-panel">
                <div className="card-header security-master-panel-header">
                  <div className="security-master-panel-header-left">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <circle cx="12" cy="16" r="1" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>

                    <h6 className="mb-0 form-label security-master-panel-title">
                      Rules Not Applied
                    </h6>
                  </div>
                  <i
                    className={`ti ti-chevron-${
                      Object.keys(rules).every(
                        (group) => expandedGroupsNotApplied[group]
                      )
                        ? "up"
                        : "down"
                    } security-master-collapse-icon`}
                    onClick={() => {
                      const allGroups = Object.keys(rules);
                      const allExpanded = allGroups.every(
                        (group) => expandedGroupsNotApplied[group]
                      );
                      const newExpandedState = {};
                      allGroups.forEach((group) => {
                        newExpandedState[group] = !allExpanded;
                      });
                      setExpandedGroupsNotApplied(newExpandedState);
                    }}
                    title={
                      Object.keys(rules).every(
                        (group) => expandedGroupsNotApplied[group]
                      )
                        ? "Collapse All Rules"
                        : "Expand All Rules"
                    }
                  />
                </div>
                <div
                  className={notAppliedBodyClassName}
                  onDragOver={allowDrop}
                  onDragEnter={handleEnterNotApplied}
                  onDrop={handleDropOnNotApplied}
                >
                  {Object.entries(rules)
                    .sort(([a], [b]) => a.trim().localeCompare(b.trim()))
                    .map(([screenName, screenRules]) => (
                      <div
                        key={screenName}
                        className="mb-2 security-master-group"
                      >
                        <div
                          className="d-flex align-items-center p-2 security-master-group-header"
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, {
                              from: "notApplied",
                              kind: "group",
                              screenName,
                            })
                          }
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input security-master-checkbox"
                              checked={
                                selectedGroupsNotApplied[screenName] || false
                              }
                              onChange={() =>
                                handleGroupSelect(
                                  screenName,
                                  screenRules,
                                  "notApplied"
                                )
                              }
                            />
                          </div>
                          <div
                            className="d-flex align-items-center justify-content-between flex-grow-1 security-master-group-header-main"
                            onClick={() => toggleGroupNotApplied(screenName)}
                          >
                            <span className="form-label security-master-group-title">
                              {screenName}
                            </span>
                            <i
                              className={`ti ti-chevron-${
                                expandedGroupsNotApplied[screenName]
                                  ? "up"
                                  : "down"
                              } security-master-group-toggle`}
                              title={
                                expandedGroupsNotApplied[screenName]
                                  ? "Collapse Sub-Rules"
                                  : "Expand Sub-Rules"
                              }
                            />
                          </div>
                        </div>
                        {expandedGroupsNotApplied[screenName] && (
                          <div className="security-master-group-content security-master-group-content--not-applied">
                            {[...screenRules]
                              .sort((a, b) =>
                                String(a.rule_name || "")
                                  .trim()
                                  .localeCompare(
                                    String(b.rule_name || "").trim()
                                  )
                              )
                              .map((rule) => (
                                <div
                                  key={rule.rule_id}
                                  className="mb-1 py-2 security-master-rule-item"
                                  onClick={(e) => e.stopPropagation()}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(e, {
                                      from: "notApplied",
                                      kind: "rule",
                                      screenName,
                                      ruleId: rule.rule_id,
                                    })
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    className="form-check-input security-master-checkbox"
                                    id={`rule-${rule.rule_id}`}
                                    checked={
                                      selectedRulesNotApplied[rule.rule_id] ||
                                      false
                                    }
                                    onChange={() =>
                                      handleRuleSelect(
                                        rule.rule_id,
                                        screenName,
                                        screenRules,
                                        "notApplied"
                                      )
                                    }
                                  />
                                  <label
                                    className="form-check-label security-master-rule-label"
                                    htmlFor={`rule-${rule.rule_id}`}
                                  >
                                    {rule.rule_name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  {Object.keys(rules).length === 0 && (
                    <div className="text-center text-muted security-master-empty-state">
                      <svg
                        className="security-master-empty-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <p className="security-master-empty-text">
                        No rules available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Arrows */}
            <div
              className={`d-flex align-items-center justify-content-center gap-4 ${arrowsContainerClassName}`}
            >
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center security-master-arrow-button"
                onClick={moveToApplied}
                title="Move selected rules to Applied"
                type="button"
              >
                <svg
                  className="security-master-arrow-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center security-master-arrow-button"
                onClick={moveToNotApplied}
                title="Move selected rules to Not Applied"
                type="button"
              >
                <svg
                  className="security-master-arrow-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* Right Panel */}
            <div className="security-master-panel-container">
              <div className="card shadow-sm security-master-panel">
                <div className="card-header security-master-panel-header">
                  <div className="security-master-panel-header-left">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <circle cx="12" cy="16" r="1" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <h6 className="mb-0 form-label security-master-panel-title">
                      Rules Applied
                    </h6>
                  </div>
                  <i
                    className={`ti ti-chevron-${
                      Object.keys(
                        appliedRules.reduce((acc, rule) => {
                          const groupName = rule.screen_name || "Other";
                          if (!acc[groupName]) acc[groupName] = [];
                          acc[groupName].push(rule);
                          return acc;
                        }, {})
                      ).every((group) => expandedGroupsApplied[group])
                        ? "up"
                        : "down"
                    } security-master-collapse-icon`}
                    onClick={() => {
                      const appliedGroups = Object.keys(
                        appliedRules.reduce((acc, rule) => {
                          const groupName = rule.screen_name || "Other";
                          if (!acc[groupName]) acc[groupName] = [];
                          acc[groupName].push(rule);
                          return acc;
                        }, {})
                      );
                      const allExpanded = appliedGroups.every(
                        (group) => expandedGroupsApplied[group]
                      );
                      const newExpandedState = {};
                      appliedGroups.forEach((group) => {
                        newExpandedState[group] = !allExpanded;
                      });
                      setExpandedGroupsApplied(newExpandedState);
                    }}
                    title={
                      Object.keys(
                        appliedRules.reduce((acc, rule) => {
                          const groupName = rule.screen_name || "Other";
                          if (!acc[groupName]) acc[groupName] = [];
                          acc[groupName].push(rule);
                          return acc;
                        }, {})
                      ).every((group) => expandedGroupsApplied[group])
                        ? "Collapse All Rules"
                        : "Expand All Rules"
                    }
                  />
                </div>
                <div
                  className={appliedBodyClassName}
                  onDragOver={allowDrop}
                  onDragEnter={handleEnterApplied}
                  onDrop={handleDropOnApplied}
                >
                  {Object.entries(
                    appliedRules.reduce((acc, rule) => {
                      const groupName = rule.screen_name || "Other";
                      if (!acc[groupName]) {
                        acc[groupName] = [];
                      }
                      acc[groupName].push({
                        ...rule,
                        screen_name: groupName, // Ensure consistent group name
                      });
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => a.trim().localeCompare(b.trim()))
                    .map(([screenName, screenRules]) => (
                      <div
                        key={screenName}
                        className="mb-2 security-master-group"
                      >
                        <div
                          className="d-flex align-items-center p-2 security-master-group-header"
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, {
                              from: "applied",
                              kind: "group",
                              screenName,
                            })
                          }
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input security-master-checkbox"
                              checked={
                                selectedGroupsApplied[screenName] || false
                              }
                              onChange={() =>
                                handleGroupSelect(
                                  screenName,
                                  screenRules,
                                  "applied"
                                )
                              }
                            />
                          </div>
                          <div
                            className="d-flex align-items-center justify-content-between flex-grow-1 security-master-group-header-main"
                            onClick={() => toggleGroupApplied(screenName)}
                          >
                            <span className="form-label security-master-group-title">
                              {screenName}
                            </span>
                            <i
                              className={`ti ti-chevron-${
                                expandedGroupsApplied[screenName]
                                  ? "up"
                                  : "down"
                              } security-master-group-toggle`}
                              title={
                                expandedGroupsApplied[screenName]
                                  ? "Collapse Sub-Rules"
                                  : "Expand Sub-Rules"
                              }
                            />
                          </div>
                        </div>
                        {expandedGroupsApplied[screenName] && (
                          <div className="security-master-group-content security-master-group-content--applied">
                            {[...screenRules]
                              .sort((a, b) =>
                                String(a.rule_name || "")
                                  .trim()
                                  .localeCompare(
                                    String(b.rule_name || "").trim()
                                  )
                              )
                              .map((rule) => (
                                <div
                                  key={rule.rule_id}
                                  className="mb-1 py-2 security-master-rule-item"
                                  onClick={(e) => e.stopPropagation()}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(e, {
                                      from: "applied",
                                      kind: "rule",
                                      screenName,
                                      ruleId: rule.rule_id,
                                    })
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    className="form-check-input security-master-checkbox"
                                    id={`applied-rule-${rule.rule_id}`}
                                    checked={
                                      selectedRulesApplied[rule.rule_id] ||
                                      false
                                    }
                                    onChange={() =>
                                      handleRuleSelect(
                                        rule.rule_id,
                                        screenName,
                                        screenRules,
                                        "applied"
                                      )
                                    }
                                  />
                                  <label
                                    className="form-check-label security-master-rule-label"
                                    htmlFor={`applied-rule-${rule.rule_id}`}
                                  >
                                    {rule.rule_name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  {appliedRules.length === 0 && (
                    <div className="text-center text-muted security-master-empty-state">
                      <svg
                        className="security-master-empty-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <p className="security-master-empty-text">
                        No rules applied
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMaster;

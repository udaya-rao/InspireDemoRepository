import React, { useState, useRef, useEffect, useCallback } from "react";
import SortableTable from "../../components/SortableTable";
import RightDrawer from "../../components/RightDrawer";
import SaveOrUpdateEmployerForm from "./SaveOrUpdateEmployerForm";
import { useToast } from "../../components/useToast";
import Loader from "../../components/Loader";
import { ConfirmDialog } from "../../components/Notification";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges.jsx";
import {
  fetchEmployerDetails,
  fetchEmployerList,
} from "../../services/employerService";

const employerColumns = [
  { key: 'actions', label: 'Actions', sortable: false },
  { key: 'name', label: 'Company Name', searchable: true, sortable: true },
  { key: 'address', label: 'Address', searchable: true, sortable: false },
  { key: 'email', label: 'Email', searchable: true, sortable: true },
  { key: 'mobileNumber', label: 'Mobile Number', searchable: true, sortable: true },
  { key: 'gstNumber', label: 'GST Number', searchable: true, sortable: true },
];

export default function Employers() {
  const [employerData, setEmployerData] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editEmployer, setEditEmployer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const tableRef = useRef();
  const editFormRef = useRef();
  const { showToast } = useToast();
  
  // REPLACE HARDCODED DIRTY STATE WITH REUSABLE HOOK
  const {
    isDirty,
    setIsDirty,
    resetDirty,
  } = useUnsavedChanges({
    title: "Unsaved Changes",
    message: "You have unsaved changes. Are you sure you want to leave?"
  });
  // Centralized employers fetch using service (same structure as Employee page)
  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchEmployerList();
      const list = result?.data?.EMPLOYER_LIST || [];
      const mappedData = list.map((emp) => ({
        employerID: emp.emp_id,
        name: emp.name,
        address: emp.address,
        phone: emp.phone,
        fax: emp.fax,
        email: emp.email,
        kstRef: emp.kst_ref,
        cstRef: emp.cst_ref,
        kstDate: emp.kst_date,
        cstDate: emp.cst_date,
        panNo: emp.pan_no,
        serviceTaxNo: emp.servicetax_no,
        mobileNumber: emp.mobile_no,
        enquiryDetails: emp.enquiry_details,
        ordersDetails: emp.orders_details,
        dispatchDetails: emp.dispatch_details,
        mktDetails: emp.mkt_details,
        techDetails: emp.tech_details,
        quotationDetails: emp.qtn_details,
        exciseRegNo: emp.excise_reg_no,
        exciseRange: emp.excise_range,
        exciseDivision: emp.excise_division,
        commissionerRate: emp.commissionerrate,
        accountsDetails: emp.accounts_details,
        gstNumber: emp.gstin_no,
        currentLUTNo: emp.current_lut_no,
        ipAddress: emp.ip_address,
        paramType: "FETCHED",
      }));
      setEmployerData(mappedData);
    } catch (error) {
      if (error?.response?.status === 401) {
        window.dispatchEvent(new Event("sessionExpired"));
      } else {
        console.error("Error fetching employers:", error);
        setEmployerData([]);
        showToast("Failed to fetch employer list", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [setEmployerData, showToast]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const handleRefresh = async () => {
    fetchEmployers();
    tableRef.current?.refresh();
  };

  const handleEdit = (updatedEmployer) => {
    // If no payload is provided, just refetch and close gracefully
    if (!updatedEmployer) {
      fetchEmployers();
      setShowEditForm(false);
      setEditEmployer(null);
      setEditMode(false);
      return;
    }
    setEmployerData((prev) =>
      prev.map((emp) =>
        emp.employerID === updatedEmployer.employerID ? { ...updatedEmployer, paramType: 'UPDATE' } : emp
      )
    );
    setShowEditForm(false);
    setEditEmployer(null);
    setEditMode(false);
  };

  const handleEditClick = async (row) => {
    // Close profile dropdown if open
    window.dispatchEvent(new Event('closeProfileDropdown'));

    setEditMode(false);
    try {
      const result = await fetchEmployerDetails(row.employerID);
      const details = result?.data?.EMPLOYER_DETAILS?.[0];
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return dateStr.split("T")[0]; // keep only YYYY-MM-DD
      };
      if (details) {
        setEditEmployer({
          employerID: details.emp_id,
          name: details.name,
          address: details.address,
          phone: details.phone,
          fax: details.fax,
          email: details.email,
          kstRef: details.kst_ref,
          cstRef: details.cst_ref,
          kstDate: formatDate(details.kst_date),
          cstDate: formatDate(details.cst_date),
          panNo: details.pan_no,
          serviceTaxNo: details.servicetax_no,
          mobileNumber: details.mobile_no,
          enquiryDetails: details.enquiry_details,
          ordersDetails: details.orders_details,
          dispatchDetails: details.dispatch_details,
          mktDetails: details.mkt_details,
          techDetails: details.tech_details,
          quotationDetails: details.qtn_details,
          exciseRegNo: details.excise_reg_no,
          exciseRange: details.excise_range,
          exciseDivision: details.excise_division,
          commissionerRate: details.commissionerrate,
          accountsDetails: details.accounts_details,
          gstNumber: details.gstin_no,
          currentLUTNo: details.current_lut_no,
          ipAddress: details.ip_address,
          paramType: 'UPDATE',
        });
        setShowEditForm(true);
      } else {
        showToast("No details found for this employer.", 'error');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        window.dispatchEvent(new Event('sessionExpired'));
      } else {
        console.error("Error fetching employer details:", error);
        showToast("Failed to fetch employer details", 'error');
      }
    }
  };
  
  const getActions = (row) => [
    {
      label: 'View',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      onClick: () => handleEditClick(row),
    },
  ];

  const confirmCloseEdit = (forceClose = false) => {
    if (forceClose) {
      setShowEditForm(false);
      setEditEmployer(null);
      setEditMode(false);
      resetDirty();
      return;
    }
    
    setShowEditForm(false);
    setEditEmployer(null);
    setEditMode(false);
    resetDirty();
  };

  const editEmployerDrawer = (
    <RightDrawer
      open={showEditForm}
      tabKey="employer"
      onClose={confirmCloseEdit}
      title="Edit Employer"
      onSave={editMode ? (() => editFormRef.current && editFormRef.current.submit()) : undefined}
      showEdit={!!editEmployer && !editMode}
      onEdit={() => setEditMode(true)}
      disableEdit={!!editEmployer && editMode}
      isDirty={isDirty}
      onDisableEdit={() => setEditMode(false)}
      enableCloseConfirm
      closeConfirmScope="edit"
      closeConfirmTitle="Unsaved Changes"
      closeConfirmMessage="You have unsaved changes. Are you sure you want to leave?"
    >
      <SaveOrUpdateEmployerForm
        ref={editFormRef}
        onClose={() => confirmCloseEdit(true)}
        initialData={editEmployer}
        onSuccess={handleEdit}
        disabled={!editMode}
        onDirtyChange={(dirty) => setIsDirty(dirty)}
      />
    </RightDrawer>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Loader overlays on top but table is always rendered */}
      {loading && <Loader />}
      <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
        <div>
          {editEmployerDrawer}
          <SortableTable
            ref={tableRef}
            columns={employerColumns}
            data={employerData}
            title="Company Information" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M3 21h18" /><path d="M9 8h6" /><path d="M10 12h4" /><path d="M3 10V3h18v7" /><path d="M4 21v-4h16v4" /></svg>}
            onRefresh={handleRefresh}
            getActions={getActions}
            disableSearch={true}
            disablePagination={true}
            disableColumnFilters={true}
            disableSorting={true}
          />
        </div>
      </main>
      
    </div>
  );
}
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import DynamicSortableTable from "../../components/DynamicSortableTable";
import RightDrawer from "../../components/RightDrawer";
import SaveOrUpdateDailyJobData from "./SaveOrUpdateDailyJobData";
import { ConfirmDialog } from "../../components/Notification";
import Loader from "../../components/Loader";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { fetchDailyJobDataList, fetchDailyJobDataDetails } from "../../services/dailyJobService";
import { SUCCESS_STATUS } from "../../utils/ConstVariables";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";

// Table column definitions mapped to API response
const dailyJobColumns = [
    { key: "actions", label: "Actions", sortable: false, width: "0%", minWidth: "100px" },
    {
        key: "job_card_daily_no",
        label: "Daily Job No",
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "job_card_no",
        label: "Job Card No",
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },
    {
        key: "work_order_no",
        label: "WO No",
        style: { textAlign: "center" },
        width: "8%",
        minWidth: "100px",
    },

    {
        key: "item_code",
        label: "Product",
        width: "12%",
        minWidth: "140px",
        style: { textAlign: "center" },
    },
    {
        key: "item_description",
        label: "Description",
        width: "15%",
        minWidth: "180px",
        style: { textAlign: "left" },
    },
    {
        key: "operation_id_text",
        label: "Operation",
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "responsible_person_name",
        label: "Responsible Person",
        width: "15%",
        minWidth: "160px",
        style: { textAlign: "center" },
    },
    {
        key: "item_unit",
        label: "Unit",
        width: "8%",
        minWidth: "100px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_output",
        label: "Qty Output",
        width: "10%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_scrapped",
        label: "Qty Scrapped",
        width: "10%",
        minWidth: "110px",
        style: { textAlign: "center" },
    },
    {
        key: "qty_copper_scrapped",
        label: "Qty Copper Scrapped",
        width: "10%",
        minWidth: "130px",
        style: { textAlign: "center" },
    },
    // {
    //     key: "remarks",
    //     label: "Remarks",
    //     width: "15%",
    //     minWidth: "180px",
    //     style: { textAlign: "left" },
    // },
    {
        key: "prep_by",
        label: "Prepared By",
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
    {
        key: "prep_date_formatted",
        label: "Prep Date",
        width: "10%",
        minWidth: "120px",
        style: { textAlign: "center" },
    },
];

const transformRecord = (item) => {
    return {
        ...item,
        job_start_time_formatted: item.job_start_time ? formatDateTime(item.job_start_time) : "",
        job_end_time_formatted: item.job_end_time ? formatDateTime(item.job_end_time) : "",
        prep_date_formatted: formatDate(item.prep_date) || item.prep_date,
    };
};

const getBackendColumnName = (frontendKey) => {
    const mapping = {
        "job_start_time_formatted": "job_start_time",
        "job_end_time_formatted": "job_end_time",
        "prep_date_formatted": "prep_date",
    };
    return mapping[frontendKey] || frontendKey;
};

export default function DailyJobData({ jobCardID: jobCardIDProp, workOrderID: workOrderIDProp, workOrderLineID: workOrderLineIDProp, hideAdd: hideAddProp } = {}) {
    const { id: paramId } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const urlWo = searchParams.get('wo');
    const urlWol = searchParams.get('wol');
    const urlHideAdd = searchParams.get('hideAdd') === 'true';

    // Extract ID from pathname as fallback (for virtual tabs restored via TabManager)
    const pathParts = location.pathname.split('/');
    const pathId = pathParts[1] === 'dailyjobdata' && pathParts[2] ? pathParts[2] : null;

    // Resolve jobCardID: prefer prop, fallback to param, fallback to path parsing
    const id = jobCardIDProp || paramId || pathId;
    const initialWoId = workOrderIDProp || urlWo;
    const initialWolId = workOrderLineIDProp || urlWol || 0;
    const hideAdd = hideAddProp || urlHideAdd;
    const [loading, setLoading] = useState(false);
    const tableRef = useRef();
    const viewFormRef = useRef();
    const addFormRef = useRef();

    // ─── Drawer State ─────────────────────────────────────────────────────
    const [viewRow, setViewRow] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const {
        isDirty: viewIsDirty,
        setIsDirty: setViewIsDirty,
        checkUnsavedChanges: checkEditUnsavedChanges,
        resetDirty: resetEditDirty,
        dirtyConfirmDialog: editDirtyDialog,
    } = useUnsavedChanges({});

    const {
        isDirty: addIsDirty,
        setIsDirty: setAddIsDirty,
        checkUnsavedChanges: checkAddUnsavedChanges,
        resetDirty: resetAddDirty,
        dirtyConfirmDialog: addDirtyDialog,
    } = useUnsavedChanges({});



    // ─── Track last saved/updated record for highlighting ─────────────────
    const savedItemRef = useRef(null);
    const parentWorkOrderIdRef = useRef(initialWoId || null); // Initialized from prop or URL query
    const parentWorkOrderLineIdRef = useRef(initialWolId || 0);

    const parentContext = useMemo(() => ({
        jobCardID: Number(id) || 0,
        workOrderID: parentWorkOrderIdRef.current || Number(workOrderIDProp) || 0,
        workOrderLineID: parentWorkOrderLineIdRef.current || Number(workOrderLineIDProp) || 0,
    }), [id, workOrderIDProp, parentWorkOrderIdRef, workOrderLineIDProp, parentWorkOrderLineIdRef]);

    const {
        rows: dailyJobData,
        setRows: setDailyJobData,
        tableProps,
    } = usePaginatedTable([], 25, true); // Server-side pagination enabled

    // Server-side state tracking
    const [, setActiveColumnSearch] = useState({ key: "", value: "" });
    const [, setActiveColumnFilters] = useState({});
    const activeColumnFiltersRef = useRef({});
    const [activeSearchFilters, setActiveSearchFilters] = useState([]);
    const [currentSortConfig, setCurrentSortConfig] = useState({ key: "", direction: "" });
    const [isGlobalSearch, setIsGlobalSearch] = useState(0);
    const lastQueryRef = useRef(null);
    const requestSeqRef = useRef(0);

    // Close Add drawer if hideAdd becomes true (e.g. navigated from Job Card List)
    useEffect(() => {
        if (hideAdd && isAdding) {
            setIsAdding(false);
            resetAddDirty();
        }
    }, [hideAdd, isAdding, resetAddDirty]);

    // ─── Highlight saved row after data refresh ───────────────────────────
    useEffect(() => {
        if (savedItemRef.current && dailyJobData.length > 0) {
            const savedId = savedItemRef.current;
            const savedIndex = dailyJobData.findIndex((item) => {
                return (
                    savedId === item.job_card_daily_id ||
                    String(savedId) === String(item.job_card_daily_id) ||
                    Number(savedId) === Number(item.job_card_daily_id)
                );
            });

            if (savedIndex >= 0) {
                setTimeout(() => {
                    if (tableRef.current && typeof tableRef.current.selectRowByIndex === 'function') {
                        tableRef.current.selectRowByIndex(savedIndex);
                    }
                    savedItemRef.current = null;
                }, 200);
            } else {
                savedItemRef.current = null;
            }
        }
    }, [dailyJobData]);

    // ─── Row Actions ──────────────────────────────────────────────────────
    const getActions = (row) => {
        if (!hasPermission(menuPermissions.DAILY_JOB)) return [];

        return [
            {
                label: "View",
                title: "View Daily Job Details",
                icon: (
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
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                ),
                onClick: async () => {
                    const proceedToView = async (nextRow) => {
                        setViewRow(nextRow);
                        setEditMode(false);
                        resetEditDirty();
                    };

                    // Check if Add form is open and dirty (only if View drawer not already open)
                    // if (!viewRow && isAdding && !checkAddUnsavedChanges(proceedToView, row)) {
                    //     return;
                    // }

                    if (viewRow && viewIsDirty) {
                        const canProceed = await checkEditUnsavedChanges(async (nextRow) => {
                            await proceedToView(nextRow);
                        }, row);
                        if (!canProceed) return;
                        await proceedToView(row);
                        return;
                    }

                    await proceedToView(row);
                },
            }
        ];
    };

    // ─── Data Fetching ────────────────────────────────────────────────────
    const fetchDailyJobs = useCallback(
        async (
            pageSize = 25,
            pageNumber = 0,
            columnName = "",
            sortOrder = "",
            searchKeyword = "",
            isGlobalSearch = 0,
            searchFilter = [],
            options = { force: false }
        ) => {
            const mappedColumnName = getBackendColumnName(columnName);

            // Build searchFilter array
            let resolvedFilter;
            if (Array.isArray(searchFilter) && searchFilter.length > 0) {
                resolvedFilter = searchFilter.map((f, idx) => ({
                    columnName: getBackendColumnName(f.columnName || ""),
                    searchKeyword: f.searchKeyword || "",
                    sortOrder: "",
                    columnSequence: f.columnSequence || idx + 1,
                }));
            } else if (columnName || searchKeyword) {
                resolvedFilter = [
                    {
                        columnName: mappedColumnName,
                        searchKeyword: searchKeyword || "",
                        sortOrder: "",
                        columnSequence: 1,
                    },
                ];
            } else {
                resolvedFilter = [
                    {
                        columnName: "",
                        searchKeyword: "",
                        sortOrder: "",
                        columnSequence: 0,
                    },
                ];
            }

            const payload = {
                pageSize: Number(pageSize) || 0,
                pageNumber: Number(pageNumber) || 0,
                searchFilter: resolvedFilter,
                isGlobalSearch,
                sortOrder: sortOrder || "",
                jobCardID: Number(id) || 0,
            };

            const payloadKey = JSON.stringify(payload);
            if (!options?.force && lastQueryRef.current === payloadKey) return;
            lastQueryRef.current = payloadKey;

            const reqId = ++requestSeqRef.current;

            setLoading(true);
            try {
                const res = await fetchDailyJobDataList(payload);
                if (reqId !== requestSeqRef.current) return;

                const list = res?.data?.JOB_CARD_DAILY_LIST || [];
                const totalRecords = res?.data?.TOTAL_RECORDS?.[0]?.TotalRecords || list.length || 0;

                const data = (list || []).map((item) => transformRecord(item));

                setDailyJobData(data);

                // Capture workOrderID from the first row to use when creating new records only if not already set
                if (!parentWorkOrderIdRef.current && list.length > 0 && list[0].work_order_id) {
                    parentWorkOrderIdRef.current = list[0].work_order_id;
                }

                if (tableProps.setTotalRecords) {
                    tableProps.setTotalRecords(totalRecords);
                }

                if (typeof tableProps.onPageChange === "function" && Number(pageNumber) === 0) {
                    tableProps.onPageChange(1);
                }
            } catch (err) {
                console.error("Error fetching daily jobs:", err);
                if (reqId === requestSeqRef.current) {
                    setDailyJobData([]);
                }
            } finally {
                if (reqId === requestSeqRef.current) setLoading(false);
            }
        },
        [setDailyJobData, tableProps, id]
    );

    // ---------- Smart Refresh Helper ----------
    const refreshCurrentPage = useCallback(() => {
        fetchDailyJobs(
            tableProps.pageSize,
            tableProps.currentPage - 1,
            currentSortConfig.key || "",
            currentSortConfig.direction || "",
            tableProps.searchTerm || "",
            isGlobalSearch,
            activeSearchFilters,
            { force: true }
        );
    }, [fetchDailyJobs, tableProps, currentSortConfig, isGlobalSearch, activeSearchFilters]);

    // Initial load
    const fetchedIdRef = useRef(null);
    useEffect(() => {
        if (fetchedIdRef.current === id) return;
        fetchedIdRef.current = id;
        fetchDailyJobs(25, 0, "", "", "", 0, [], { force: true });
    }, [id, fetchDailyJobs]);



    // ---------- Unified query handler ----------
    const handleQueryChange = useCallback(
        (q) => {
            try {
                const pageSizeNum = Number(q?.pageSize) || 25;
                const pageNumber0 = Math.max(0, Number(q?.pageNumber) || 0);
                const columnName = String(q?.columnName || "");
                const isGlobalSearch = Number(q?.isGlobalSearch) === 1 ? 1 : 0;
                const sortOrder = String(q?.sortOrder) || "";
                const searchKeyword = String(q?.searchKeyword || "");
                const searchFilter = Array.isArray(q?.searchFilter) ? q.searchFilter : [];

                if (typeof tableProps.onPageSizeChange === "function") tableProps.onPageSizeChange(pageSizeNum);
                if (typeof tableProps.onPageChange === "function") tableProps.onPageChange(pageNumber0 + 1);
                if (typeof tableProps.setSearchTerm === "function") tableProps.setSearchTerm(isGlobalSearch === 1 ? searchKeyword : "");

                if (typeof tableProps.setSortConfig === "function" && columnName) {
                    tableProps.setSortConfig({
                        key: columnName,
                        direction: sortOrder || "asc",
                    });
                }

                if (columnName && sortOrder) {
                    setCurrentSortConfig({ key: columnName, direction: sortOrder });
                }

                let finalSearchFilter = searchFilter;
                let finalColumnName = columnName;
                let finalSearchKeyword = searchKeyword;

                if (isGlobalSearch === 1) {
                    if (searchKeyword && searchKeyword.trim().length > 0) {
                        finalSearchFilter = [
                            {
                                columnName: columnName || "",
                                searchKeyword: searchKeyword,
                                sortOrder: "",
                                columnSequence: 1,
                            },
                        ];
                    } else {
                        finalSearchFilter = [];
                    }
                    finalColumnName = columnName || "";

                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters(finalSearchFilter);
                } else if (searchFilter.length > 0) {
                    setActiveSearchFilters(searchFilter);

                    const filterMap = {};
                    searchFilter.forEach((f) => {
                        if (f.columnName && f.searchKeyword) {
                            filterMap[f.columnName] = f.searchKeyword;
                        }
                    });
                    setActiveColumnFilters(filterMap);
                    activeColumnFiltersRef.current = filterMap;

                    if (searchFilter.length === 1) {
                        setActiveColumnSearch({
                            key: searchFilter[0].columnName,
                            value: searchFilter[0].searchKeyword,
                        });
                    } else {
                        setActiveColumnSearch({ key: "", value: "" });
                    }
                } else if (columnName && (searchKeyword || "").length > 0) {
                    const nextFilters = { [columnName]: searchKeyword };
                    setActiveColumnSearch({ key: columnName, value: searchKeyword });
                    setActiveColumnFilters(nextFilters);
                    activeColumnFiltersRef.current = nextFilters;
                    setActiveSearchFilters([{ columnName, searchKeyword }]);
                } else {
                    setActiveColumnSearch({ key: "", value: "" });
                    setActiveColumnFilters({});
                    activeColumnFiltersRef.current = {};
                    setActiveSearchFilters([]);
                }

                setIsGlobalSearch(isGlobalSearch);

                fetchDailyJobs(
                    pageSizeNum,
                    pageNumber0,
                    finalColumnName,
                    sortOrder,
                    finalSearchKeyword,
                    isGlobalSearch,
                    finalSearchFilter
                );
            } catch (e) {
                console.error("Failed to handle unified query payload", e);
            }
        },
        [fetchDailyJobs, tableProps]
    );

    // ─── Refresh Handler ──────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        try {
            if (tableRef.current) {
                tableRef.current.refresh();
            }
            activeColumnFiltersRef.current = {};
            setActiveColumnSearch({ key: "", value: "" });
            setActiveColumnFilters({});
            setActiveSearchFilters([]);
            setCurrentSortConfig({ key: "", direction: "" });

            if (tableProps?.setSearchTerm) tableProps.setSearchTerm("");
            if (tableProps?.onPageChange) tableProps.onPageChange(1);
            if (tableProps?.onPageSizeChange) tableProps.onPageSizeChange(25);
            if (tableProps?.setSortConfig) tableProps.setSortConfig({ key: "", direction: "" });

            fetchDailyJobs(25, 0, "", "", "", 0, [], { force: true });
        } catch (error) {
            console.error("Error refreshing Daily Job list:", error);
        }
    }, [tableProps, fetchDailyJobs]);

    const handleAddSuccess = useCallback(async (res, values) => {
        const header = res?.data?.JOB_CARD_DAILY_RESPONSE?.[0];
        if (header) {
            const savedId = header.ID || Number(values.jobCardDailyID);
            savedItemRef.current = savedId;
            
            try {
                const detailRes = await fetchDailyJobDataDetails({ jobCardDailyID: savedId });
                if (detailRes && detailRes.Status === SUCCESS_STATUS && detailRes.data?.JOB_CARD_DAILY_DETAILS_RESPONSE?.length > 0) {
                    const fetchedRecord = detailRes.data.JOB_CARD_DAILY_DETAILS_RESPONSE[0];
                    const newRecord = transformRecord(fetchedRecord);
                    
                    setDailyJobData((prevData) => {
                        const filtered = prevData.filter(item => item.job_card_daily_id !== savedId);
                        return [newRecord, ...filtered];
                    });

                    if (typeof tableProps.setTotalRecords === "function") {
                        const currentTotal = tableProps.totalRecords || 0;
                        tableProps.setTotalRecords(currentTotal + 1);
                    }
                } else {
                    refreshCurrentPage();
                }
            } catch (err) {
                console.error("Failed to fetch newly created Daily Job Data record", err);
                refreshCurrentPage();
            }
        } else {
            refreshCurrentPage();
        }
        setIsAdding(false);
        resetAddDirty();
    }, [refreshCurrentPage, resetAddDirty, setDailyJobData, tableProps]);

    const handleAddClose = useCallback(async () => {
        const ok = await checkAddUnsavedChanges();
        if (ok) {
            setIsAdding(false);
            resetAddDirty();
        }
    }, [checkAddUnsavedChanges, resetAddDirty]);

    const handleEditSuccess = useCallback(async (res, values) => {
        const header = res?.data?.JOB_CARD_DAILY_RESPONSE?.[0];
        if (header) {
            const savedId = header.ID || Number(values.jobCardDailyID);
            savedItemRef.current = savedId;
            refreshCurrentPage();
        }
        setViewRow(null);
        setEditMode(false);
        resetEditDirty();
    }, [refreshCurrentPage, resetEditDirty]);

    const handleEditClose = useCallback(async () => {
        const ok = await checkEditUnsavedChanges();
        if (ok) {
            setViewRow(null);
            setEditMode(false);
            resetEditDirty();
        }
    }, [checkEditUnsavedChanges, resetEditDirty]);

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div style={{ position: "relative" }}>
            {loading && <Loader />}

            <main className="p-1" style={{ flexGrow: 1, overflow: "auto" }}>
                <div style={{ height: "100%" }}>
                    <DynamicSortableTable
                        ref={tableRef}
                        columns={dailyJobColumns}
                        data={dailyJobData}
                        fixedFirstColumn={true}
                        title="Daily Job Data"
                        onAdd={(hasPermission(menuPermissions.DAILY_JOB_CREATE) && !hideAdd) ? () => {
                            setIsAdding(true);
                        } : undefined}
                        icon={
                            <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
                            </svg>
                        }
                        onRefresh={handleRefresh}
                        onQueryChange={handleQueryChange}
                        getActions={getActions}
                        showGlobalSearch={true}
                        autoSelectFirstRow={true}
                        currentPage={tableProps.currentPage}
                        pageSize={tableProps.pageSize}
                        totalRecords={tableProps.totalRecords}
                        sortConfig={tableProps.sortConfig}
                        searchTerm={tableProps.searchTerm}
                    // showDisplayAll={true}
                    // onDisplayAll={handleDisplayAll}
                    />
                </div>
            </main>

            {/* ── Add Drawer ─────────────────────────────────────────────── */}
            <RightDrawer
                open={isAdding}
                tabKey={`dailyjobdata-${id}`}
                onClose={handleAddClose}
                title="Add Daily Job Data"
                onSave={() => addFormRef.current && addFormRef.current.submit()}
                isDirty={addIsDirty}
                enableCloseConfirm={true}
                closeConfirmScope="create"
                isCreate={true}
                closeConfirmTitle="Unsaved Changes"
                closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
                onSaveDraft={() => addFormRef.current && addFormRef.current.saveDraft()}
                onDiscardDraft={() => {
                    if (addFormRef.current) addFormRef.current.clearDraft();
                    resetAddDirty();
                }}
            >
                <SaveOrUpdateDailyJobData
                    key={isAdding ? "add-drawer" : "empty-add"}
                    ref={addFormRef}
                    open={isAdding}
                    initialData={null}
                    editMode={true}
                    parentContext={parentContext}
                    onDirtyChange={setAddIsDirty}
                    onSuccess={handleAddSuccess}
                    onClose={handleAddClose}
                />
            </RightDrawer>

            {/* ── View/Edit Drawer ──────────────────────────────────────────── */}
            <RightDrawer
                open={!!viewRow}
                tabKey={`dailyjobdata-${id}`}
                onClose={handleEditClose}
                title="View Daily Job Data"
                onSave={editMode ? () => viewFormRef.current && viewFormRef.current.submit() : undefined}
                showEdit={!!viewRow && !editMode && hasPermission(menuPermissions.DAILY_JOB_EDIT)}
                onEdit={() => setEditMode(true)}
                disableEdit={editMode}
                onDisableEdit={() => {
                    setEditMode(false);
                }}
                isDirty={viewIsDirty}
                enableCloseConfirm={true}
                closeConfirmScope="edit"
                closeConfirmTitle="Unsaved Changes"
                closeConfirmMessage="You have unsaved changes. Are you sure you want to close?"
                disableTabCloseConfirm={!!viewRow && !editMode && !viewIsDirty}
                onSaveDraft={() => viewFormRef.current && viewFormRef.current.saveDraft()}
                onDiscardDraft={() => {
                    if (viewFormRef.current) viewFormRef.current.clearDraft();
                    resetEditDirty();
                }}
            >
                {viewRow && (
                    <SaveOrUpdateDailyJobData
                        key={viewRow ? (viewRow.job_card_daily_id || "row") : "empty"}
                        ref={viewFormRef}
                        open={!!viewRow}
                        initialData={viewRow}
                        editMode={editMode}
                        parentContext={parentContext}
                        onDirtyChange={setViewIsDirty}
                        onSuccess={handleEditSuccess}
                        onClose={handleEditClose}
                    />
                )}
            </RightDrawer>

            <ConfirmDialog
                {...addDirtyDialog}
                confirmLabel="Yes"
                cancelLabel="No"
                title="Unsaved Changes"
            />
            <ConfirmDialog
                {...editDirtyDialog}
                confirmLabel="Yes"
                cancelLabel="No"
                title="Unsaved Changes"
            />
        </div>
    );
}
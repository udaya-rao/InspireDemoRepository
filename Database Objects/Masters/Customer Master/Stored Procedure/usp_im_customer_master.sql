ALTER PROCEDURE "DBA"."usp_im_customer_master"
/***************************************************
Procedure Name          : usp_im_customer_master
Author                  : Ranjitha R
Created Date            : 30/12/2025
Copyright©              : Copyright © InspireMagnetics 2025
____________________________________________________  
Purpose                 : This SP is used to perform CRUD operations for the customer_master table.
____________________________________________________  
Input Parameters        :

1. @XMLParams           - XML Parameter
____________________________________________________
Tables Used  
1. customer_master
____________________________________________________  
Modules Affected  
1. Customer Management
****************************************************/
(IN @XMLParams XML)
BEGIN
    DECLARE @customer_id INTEGER DEFAULT NULL;
    DECLARE @customer_name VARCHAR(100) DEFAULT NULL;
    DECLARE @customer_primary_address_line1 VARCHAR(100) DEFAULT NULL;
    DECLARE @customer_primary_address_line2 VARCHAR(100) DEFAULT NULL;
    DECLARE @customer_pin_code VARCHAR(6) DEFAULT NULL;
    DECLARE @customer_type SMALLINT DEFAULT NULL;
    DECLARE @customer_website VARCHAR(100) DEFAULT NULL;
    DECLARE @gstin_number VARCHAR(15) DEFAULT NULL;
    DECLARE @pan_number VARCHAR(10) DEFAULT NULL;
    DECLARE @customer_status SMALLINT DEFAULT NULL;
    DECLARE @customer_supply VARCHAR(1) DEFAULT NULL;
    DECLARE @responsible_person_id INTEGER DEFAULT NULL;
    DECLARE @prep_by VARCHAR(50) DEFAULT NULL;
    DECLARE @update_by VARCHAR(50) DEFAULT NULL;
    DECLARE @ParamType VARCHAR(100);
    DECLARE @PageSize INT DEFAULT NULL;
    DECLARE @PageNumber INT DEFAULT NULL;
    DECLARE row_count INT;

    
    DECLARE @column_name       VARCHAR(200) DEFAULT NULL;
    DECLARE @sort_column_name  VARCHAR(2000) DEFAULT NULL; 
    DECLARE @static_column_name  VARCHAR(2000) DEFAULT NULL; 
    DECLARE @sort_order        VARCHAR(10)  DEFAULT NULL;
    DECLARE @search_keyword    VARCHAR(200) DEFAULT NULL;
    DECLARE v_sort_col         VARCHAR(128);
    DECLARE v_sort_dir         VARCHAR(4);
    DECLARE v_has_search       TINYINT;
    DECLARE v_sql              LONG VARCHAR;
    DECLARE v_cnt_sql          LONG VARCHAR;
    DECLARE v_kw               VARCHAR(300);
    DECLARE v_first_kw         VARCHAR(1000);  
    DECLARE v_start_at         INT;
    DECLARE v_top              INT;
    DECLARE v_where_col_expr   LONG VARCHAR;
    DECLARE v_where_clause  LONG VARCHAR;
    DECLARE v_shortcut_clause LONG VARCHAR;   -- shortcut-only predicate
    DECLARE v_where_final     LONG VARCHAR;   -- final WHERE (shortcut + search)
    DECLARE v_from_source     LONG VARCHAR;   -- table/view name to query
    DECLARE @columns_list     LONG VARCHAR;
    DECLARE @sort_columns_list LONG VARCHAR; 
    DECLARE v_order_by         LONG VARCHAR;  
    DECLARE @search_condition LONG VARCHAR;
    DECLARE @keywords_list   LONG VARCHAR;

    SELECT 
        CustomerID, CustomerName, CustomerPrimaryAddressLine1, CustomerPrimaryAddressLine2, CustomerPinCode, CustomerType, 
        CustomerWebsite, GSTINNumber, PanNumber, CustomerStatus, CustomerSupply, ResponsiblePersonID, PreparedBy, UpdatedBy,
        ParamType, PageSize, PageNumber, ColumnName, IsGlobalSearch, SortOrder, SearchKeyword, SortColumns
    INTO   
        @customer_id, @customer_name, @customer_primary_address_line1, @customer_primary_address_line2, @customer_pin_code, @customer_type, 
        @customer_website, @gstin_number, @pan_number, @customer_status, @customer_supply, @responsible_person_id, @prep_by, @update_by,
        @ParamType, @PageSize, @PageNumber, @column_name, @IsGlobalSearch, @sort_order, @search_keyword, @sort_column_name
        
    FROM OPENXML(@XMLParams, '/CustomerMaster')
    WITH (
        CustomerID INTEGER 'CustomerID',
        CustomerName VARCHAR(100) 'CustomerName',
        CustomerPrimaryAddressLine1 VARCHAR(100) 'CustomerPrimaryAddressLine1',
        CustomerPrimaryAddressLine2 VARCHAR(100) 'CustomerPrimaryAddressLine2',
        CustomerPinCode VARCHAR(6) 'CustomerPinCode',
        CustomerType SMALLINT 'CustomerType',
        CustomerWebsite VARCHAR(100) 'CustomerWebsite',
        GSTINNumber VARCHAR(15) 'GSTINNumber',
        PanNumber VARCHAR(10) 'PanNumber',
        CustomerStatus SMALLINT 'CustomerStatus',
        CustomerSupply VARCHAR(1) 'CustomerSupply',
        ResponsiblePersonID INTEGER 'ResponsiblePersonID',
        PreparedBy VARCHAR(50) 'PreparedBy',
        UpdatedBy VARCHAR(50) 'UpdatedBy',
        ParamType VARCHAR(100) 'ParamType',
        PageSize INTEGER 'PageSize',
        PageNumber INTEGER 'PageNumber',
        ColumnName VARCHAR(200) 'ColumnName',
        IsGlobalSearch BIT 'IsGlobalSearch',
        SortOrder VARCHAR(10) 'SortOrder',
        SearchKeyword VARCHAR(200) 'SearchKeyword',
        SortColumns VARCHAR(2000) 'SortColumns'
    );

    IF @ParamType = 'ADD' THEN
        IF @customer_id = 0 THEN
            IF NOT EXISTS (SELECT 1 FROM "customer_master" WHERE customer_name = @customer_name) THEN
                INSERT INTO "customer_master" (
                    customer_name, customer_primary_address_line1, customer_primary_address_line2, customer_pin_code, customer_type,
                    customer_website, gstin_number, pan_number, customer_status, customer_supply, responsible_person_id, prep_by, 
                    prep_date) 
                VALUES (
                    @customer_name, @customer_primary_address_line1, @customer_primary_address_line2, @customer_pin_code, @customer_type, 
                    @customer_website, @gstin_number, @pan_number, @customer_status, @customer_supply, @responsible_person_id, @prep_by, 
                    GETDATE());

                SELECT @@ROWCOUNT INTO row_count;
                IF row_count > 0 THEN
                    COMMIT;
                    SET @customer_id = @@IDENTITY;
                    SELECT @customer_id AS 'ID', 'Success' AS 'Status', 'Customer Master Saved Successfully !!!' AS 'Message'; 
                    RETURN;      
                END IF;
            ELSE
                SET @customer_id = @@IDENTITY;
                SELECT @customer_name AS 'ID', 'Error' AS 'Status', 'The Entered Customer Name Already Exists. Use UPDATE Operation Instead !!!' AS 'Message';
                RETURN; 
            END IF;  
                
        ELSEIF @customer_id > 0 THEN
            IF EXISTS (SELECT 1 FROM customer_master WHERE customer_id = @customer_id) THEN
                UPDATE "customer_master"
                SET
                    customer_name = COALESCE(@customer_name, customer_name),
                    customer_primary_address_line1 = COALESCE(@customer_primary_address_line1, customer_primary_address_line1),
                    customer_primary_address_line2 = @customer_primary_address_line2,
                    customer_pin_code = COALESCE(@customer_pin_code, customer_pin_code),
                    customer_type = COALESCE(@customer_type, customer_type),
                    customer_website = @customer_website, 
                    gstin_number = COALESCE(@gstin_number, gstin_number),
                    pan_number = COALESCE(@pan_number, pan_number),
                    customer_status = COALESCE(@customer_status, customer_status),
                    customer_supply = COALESCE(@customer_supply, customer_supply),
                    responsible_person_id = @responsible_person_id, 
                    update_by = @update_by, 
                    update_date = GETDATE()
                WHERE customer_id = @customer_id;

                SELECT @@ROWCOUNT INTO row_count;
                IF row_count > 0 THEN
                    COMMIT;
                    SELECT @customer_id AS 'ID', 'Success' AS 'Status', 'Customer Master Updated Successfully !!!' AS 'Message';
                END IF;
            ELSE
                SELECT @customer_id AS 'ID', 'Error' AS 'Status', 'Customer Master ID Does Not Exist !!!' AS 'Message';
            END IF;
        END IF;
    END IF;

    IF @ParamType = 'GetCustomerMasterDetails' THEN
        IF EXISTS (SELECT 1 FROM v_get_customer_master WHERE customer_id = @customer_id) THEN
            SELECT 'Success' AS 'Status', * FROM v_get_customer_master
            WHERE customer_id = @customer_id;

            SELECT 'Success' AS 'Status', * FROM "customer_contact_master"
            WHERE customer_id = @customer_id ORDER BY customer_contact_id;
        ELSE
            SELECT 'Error' AS 'Status', 'Customer Master ID Does Not Exist !!!' AS 'Message';
        END IF;
    END IF;

    IF @ParamType = 'DeleteCustomerMaster' THEN
        IF NOT EXISTS (SELECT 1 FROM "customer_master" WHERE customer_id = @customer_id) THEN
            SELECT @customer_id AS 'ID', 'Error' AS 'Status', 'Customer Master ID Does Not Exist !!!' AS 'Message';
        ELSE
            DELETE FROM customer_contact_master
            WHERE customer_id = @customer_id;

            DELETE FROM customer_master
            WHERE customer_id = @customer_id;
            
            SELECT @@ROWCOUNT INTO row_count;
            IF row_count > 0 THEN
                COMMIT;
                SELECT @customer_id AS 'ID', 'Success' AS 'Status', 'Customer Master Deleted Successfully !!!' AS 'Message';
            ELSE
                SELECT @customer_id AS 'ID','Error' AS 'Status',  'Customer Master ID Does Not Exist !!!' AS 'Message';
            END IF;
        END IF;
    END IF;

     IF @ParamType = 'CheckCustomerNameExist' THEN //customer_name
        SELECT count(customer_name) INTO row_count FROM customer_master WHERE customer_name = @customer_name;
        IF row_count > 0 THEN
            SELECT 'Error' AS 'Status', 'Customer Name ' + @customer_name + ' Already Been Entered In Customer Master!, Please Enter New Customer Name !!!' AS 'Message'; 
        END IF;
    END IF;

//    IF @ParamType = 'GetCustomerSelectionList' THEN 
//        IF @CustomerList = 'CustomerSelectionDesign' THEN //This is used in all the screens which comes under Design menu except FAIR Report Master
//            SELECT 'Success' AS 'Status',* FROM v_get_customer_information_overview WHERE status = '1' and customer_type <> 4;
//        ELSEIF @CustomerList = 'DistributorSelection' THEN   //This is used in Customer detail screen
//            SELECT 'Success' AS 'Status',* FROM v_get_customer_information_overview WHERE status = '1' and customer_type = 3;
//        END IF;
//    END IF;


     IF @ParamType = 'GetCustomerMasterByPagination' THEN
        BEGIN
                /* ---------------- Init ---------------- */
            SET @columns_list       = TRIM(COALESCE(@column_name, ''));
            SET @keywords_list      = TRIM(COALESCE(@search_keyword, ''));
            SET @sort_columns_list  = TRIM(COALESCE(@sort_column_name, ''));            
            SET @static_column_name = 'customer_id,customer_name,customer_primary_address_line1, customer_primary_address_line2,customer_pin_code, customer_type,' ||
                                      'customer_type_text,customer_website, gstin_number,pan_number,customer_status, customer_status_text,customer_supply,' ||
                                      'customer_supply_text,responsible_person_id, responsible_person_name,prep_by,prep_date, update_by,update_date';            
            SET @search_condition = NULL;
            
            DROP TABLE IF EXISTS #sort_cols;
            DROP TABLE IF EXISTS #sort_dirs;
            DROP TABLE IF EXISTS #kw_pos;
            DROP TABLE IF EXISTS #search_cols;
            
            CREATE LOCAL TEMPORARY TABLE #sort_cols
            (
                pos INTEGER DEFAULT AUTOINCREMENT,
                col VARCHAR(1000)
            ) ON COMMIT PRESERVE ROWS;
            
            CREATE LOCAL TEMPORARY TABLE #sort_dirs
            (
                pos INTEGER DEFAULT AUTOINCREMENT,
                dir VARCHAR(1000)
            ) ON COMMIT PRESERVE ROWS;
            
            CREATE LOCAL TEMPORARY TABLE #kw_pos
            (
                pos INTEGER DEFAULT AUTOINCREMENT,
                kw VARCHAR(1000)
            ) ON COMMIT PRESERVE ROWS;
            
            CREATE LOCAL TEMPORARY TABLE #search_cols
            (
                pos INTEGER DEFAULT AUTOINCREMENT,
                col VARCHAR(1000)
            ) ON COMMIT PRESERVE ROWS;
            
            INSERT INTO #sort_cols (col)
            SELECT LOWER(TRIM(row_value))
            FROM sa_split_list(CAST(@sort_columns_list AS VARCHAR(1000)), ',')
            WHERE LENGTH(TRIM(row_value)) > 0;
            
            INSERT INTO #sort_dirs (dir)
            SELECT UPPER(TRIM(row_value))
            FROM sa_split_list(CAST(COALESCE(@sort_order,'') AS VARCHAR(1000)), ',')
            WHERE LENGTH(TRIM(row_value)) > 0;
            
            INSERT INTO #kw_pos (kw)
            SELECT TRIM(row_value)
            FROM sa_split_list(CAST(@keywords_list AS VARCHAR(1000)), ',')
            WHERE LENGTH(TRIM(row_value)) > 0;
            
            INSERT INTO #search_cols (col)
            SELECT LOWER(TRIM(row_value))
            FROM sa_split_list(CAST(@columns_list AS VARCHAR(1000)), ',')
            WHERE LENGTH(TRIM(row_value)) > 0;
            
            /* ---------------- Sorting Whitelist ---------------- */
            
            SELECT TOP 1 c.col
            INTO v_sort_col
            FROM #sort_cols c
            WHERE c.col IN (SELECT LOWER(TRIM(row_value))
                            FROM sa_split_list(CAST(@static_column_name AS VARCHAR(2000)), ',')
                            WHERE LENGTH(TRIM(row_value)) > 0
            )
            ORDER BY c.pos;
            
            IF v_sort_col IS NULL OR LENGTH(TRIM(v_sort_col)) = 0 THEN
                SET v_sort_col = 'customer_name';
            END IF;
            
            /* ---------------- Build ORDER BY ---------------- */            
            SELECT LIST(col_order, ', ')
            INTO v_order_by
            FROM (
                SELECT
                    c.col || ' ' ||
                    CASE
                        WHEN UPPER(COALESCE(d.dir,'')) = 'DESC' THEN 'DESC'
                        WHEN UPPER(COALESCE(d.dir,'')) = 'ASC' THEN 'ASC'
                        ELSE ''
                    END AS col_order
                FROM #sort_cols c
                LEFT JOIN #sort_dirs d 
                    ON d.pos = c.pos
                WHERE c.col IN (
                    SELECT LOWER(TRIM(row_value))
                    FROM sa_split_list(CAST(@static_column_name AS VARCHAR(2000)), ',')
                    WHERE LENGTH(TRIM(row_value)) > 0
                )
                ORDER BY c.pos
            ) AS t;
            
            IF v_order_by IS NULL OR LENGTH(TRIM(v_order_by)) = 0 THEN
                SET v_order_by = 'customer_name ASC';
            END IF;

             --Sort direction
            SET v_sort_dir = CASE WHEN UPPER(COALESCE(@sort_order,'')) = 'DESC' THEN 'DESC' ELSE 'ASC' END;   
            
            SELECT LIST('(' || x.col || ' LIKE ''%' || REPLACE(x.kw, '''', '''''') || '%'' )', ' AND ')
            INTO @search_condition
            FROM (
                SELECT
                    sc.pos,
                    sc.col,
                    k.kw
                FROM #search_cols sc
                LEFT JOIN #kw_pos k 
                    ON k.pos = sc.pos
                WHERE sc.col IN (
                    SELECT LOWER(TRIM(row_value))
                    FROM sa_split_list(CAST(@static_column_name AS VARCHAR(2000)), ',')
                    WHERE LENGTH(TRIM(row_value)) > 0
                )
                  AND k.kw IS NOT NULL
                  AND LENGTH(TRIM(k.kw)) > 0
                ORDER BY sc.pos
            ) AS x;
            
            /* ---------------- Global Search ---------------- */            
            IF COALESCE(@IsGlobalSearch,0) = 1 THEN
                SET @search_condition = NULL;
            END IF;
            
            /* ---------------- Fallback Search ---------------- */            
            SELECT TOP 1 kw INTO v_first_kw FROM #kw_pos ORDER BY pos;
            
            SET v_has_search = CASE WHEN v_first_kw IS NOT NULL AND LENGTH(TRIM(v_first_kw)) > 0 THEN 1 ELSE 0 END;            
            IF v_has_search = 1 THEN
                SET v_kw = '%' || REPLACE(v_first_kw, '''', '''''') || '%';
            END IF;
            
            --Column expr for single-column LIKE (cast non-text)
            IF EXISTS ( SELECT 1 FROM sa_split_list(CAST(@static_column_name AS VARCHAR(2000)), ',') WHERE LOWER(TRIM(row_value)) = LOWER(v_sort_col)) THEN
                SET v_where_col_expr = v_sort_col;
            ELSE
                SET v_where_col_expr = 'CAST(' || v_sort_col || ' AS VARCHAR(50))';
            END IF;

            IF @search_condition IS NOT NULL AND LENGTH(@search_condition) > 0 THEN
                SET v_where_clause = @search_condition;
            ELSE
                SET v_where_clause = NULL;            
                IF v_has_search = 1 THEN
                    IF COALESCE(@IsGlobalSearch,0) = 1 THEN
                        SET v_where_clause = '(customer_name LIKE ''' || v_kw || ''' OR customer_supply_text LIKE ''' || v_kw || ''' OR customer_type_text LIKE ''' || v_kw || ''' OR gstin_number LIKE ''' || v_kw || ''' OR responsible_person_name LIKE ''' || v_kw || ''')';
                    ELSE
                        SET v_where_clause = v_where_col_expr || ' LIKE ''' || v_kw || '''';
                    END IF;
                END IF;
            END IF;
            
            /* ---------------- Final Source ---------------- */            
            SET v_from_source = 'v_get_customer_master';
            SET v_where_final = v_where_clause;
            
            /* ---------------- Full vs Pagination ---------------- */
            
            IF COALESCE(@PageNumber,0) = 0 AND COALESCE(@PageSize,0) = 0 THEN
            
                SET v_sql = 'SELECT * FROM ' || v_from_source;
            
                IF v_where_final IS NOT NULL THEN
                    SET v_sql = v_sql || ' WHERE ' || v_where_final;
                END IF;            
                SET v_sql = v_sql || ' ORDER BY ' || v_order_by;            
                EXECUTE IMMEDIATE v_sql;            
            ELSE            
                SET v_cnt_sql = 'SELECT COUNT(*) AS TotalRecords FROM ' || v_from_source;            
                IF v_where_final IS NOT NULL THEN
                    SET v_cnt_sql = v_cnt_sql || ' WHERE ' || v_where_final;
                END IF;            
                EXECUTE IMMEDIATE v_cnt_sql;
            
                SET v_start_at = (@PageNumber * @PageSize) + 1;
                SET v_top      = @PageSize;
            
                SET v_sql = 'SELECT TOP ' || CAST(v_top AS VARCHAR(10))
                         || ' START AT ' || CAST(v_start_at AS VARCHAR(10))
                         || ' * FROM ' || v_from_source;
            
                IF v_where_final IS NOT NULL THEN
                    SET v_sql = v_sql || ' WHERE ' || v_where_final;
                END IF;
            
                SET v_sql = v_sql || ' ORDER BY ' || v_order_by;
            
                EXECUTE IMMEDIATE v_sql;            
            END IF;
            
            DROP TABLE IF EXISTS #sort_cols;
            DROP TABLE IF EXISTS #sort_dirs;
            DROP TABLE IF EXISTS #kw_pos;
            DROP TABLE IF EXISTS #search_cols;
        END;
    END IF;

    IF @ParamType = 'GetCustomerMasterInQuotationByPagination' THEN ---customer_id dropdown in quotation and order header screen
        IF COALESCE(@PageNumber,0)=0 AND COALESCE(@PageSize,0)=0 THEN
            SELECT
                customer_id AS ValueText,
                customer_name AS DisplayText,
                customer_supply_text,
                TRIM(
                    COALESCE(customer_primary_address_line1, '') ||
                    CASE
                        WHEN COALESCE(customer_primary_address_line1, '') <> ''
                         AND COALESCE(customer_primary_address_line2, '') <> ''
                        THEN ', '
                        ELSE ''
                    END ||
                    COALESCE(customer_primary_address_line2, '')
                ) AS CustomerAddress,
                customer_primary_address_line1,
                customer_primary_address_line2,
                customer_pin_code
            FROM v_get_customer_master
            WHERE customer_status = 1
              AND (
                    COALESCE(@search_keyword,'') = ''
                    OR customer_name LIKE '%' || @search_keyword || '%'
                  )
            ORDER BY customer_name;   
        ELSE    
            SELECT COUNT(*) AS TotalRecords
            FROM v_get_customer_master
            WHERE customer_status = 1
              AND (
                    COALESCE(@search_keyword,'') = ''
                    OR customer_name LIKE '%' || @search_keyword || '%'
                  );
    
            SELECT
                'Success' AS 'Status',
                ValueText,
                DisplayText,
                customer_supply_text,
                CustomerAddress,
                customer_primary_address_line1,
                customer_primary_address_line2,
                customer_pin_code
                FROM
                (
                    SELECT
                        ROW_NUMBER() OVER (ORDER BY customer_name) AS row_num,
                        customer_id AS ValueText,
                        customer_name AS DisplayText,
                        customer_supply_text,
                        TRIM(
                            COALESCE(customer_primary_address_line1, '') ||
                            CASE
                                WHEN COALESCE(customer_primary_address_line1, '') <> ''
                                 AND COALESCE(customer_primary_address_line2, '') <> ''
                                THEN ', '
                                ELSE ''
                            END ||
                            COALESCE(customer_primary_address_line2, '')
                        ) AS CustomerAddress,
                        customer_primary_address_line1,
                        customer_primary_address_line2,
                        customer_pin_code
                FROM v_get_customer_master
                WHERE customer_status = 1
                  AND (
                        COALESCE(@search_keyword,'') = ''
                        OR customer_name LIKE '%' || @search_keyword || '%'
                      )
            ) X
            WHERE row_num > (@PageNumber * @PageSize)
              AND row_num <= ((@PageNumber + 1) * @PageSize)
            ORDER BY DisplayText;
    
        END IF;
    END IF;
	
	IF @ParamType = 'GetCustomerMasterInDeliveryNoteByPagination' THEN

		IF COALESCE(@PageNumber, 0) = 0 AND COALESCE(@PageSize, 0) = 0 THEN
			SELECT DISTINCT
				cm.customer_id AS ValueText,
				cm.customer_name AS DisplayText,
				cm.customer_supply_text,
				TRIM(
					COALESCE(cm.customer_primary_address_line1, '') ||
					CASE
						WHEN COALESCE(cm.customer_primary_address_line1, '') <> ''
						 AND COALESCE(cm.customer_primary_address_line2, '') <> ''
						THEN ', '
						ELSE ''
					END ||
					COALESCE(cm.customer_primary_address_line2, '')
				) AS CustomerAddress,
				cm.customer_primary_address_line1,
				cm.customer_primary_address_line2,
				cm.customer_pin_code
			FROM v_get_customer_master cm
			INNER JOIN order_header oh
				ON oh.customer_id = cm.customer_id
			WHERE cm.customer_status = 1
			  AND oh.doc_status = 30
			  AND (
					COALESCE(@search_keyword, '') = ''
					OR cm.customer_name LIKE '%' || @search_keyword || '%'
				  )
			ORDER BY DisplayText;

		ELSE

			SELECT COUNT(DISTINCT cm.customer_id) AS TotalRecords
			FROM v_get_customer_master cm
			INNER JOIN order_header oh
				ON oh.customer_id = cm.customer_id
			WHERE cm.customer_status = 1
			  AND oh.doc_status = 30
			  AND (
					COALESCE(@search_keyword, '') = ''
					OR cm.customer_name LIKE '%' || @search_keyword || '%'
				  );

			SELECT
				'Success' AS 'Status',
				ValueText,
				DisplayText,
				customer_supply_text,
				CustomerAddress,
				customer_primary_address_line1,
				customer_primary_address_line2,
				customer_pin_code
			FROM
			(
				SELECT
					ROW_NUMBER() OVER (
						ORDER BY cm.customer_name, cm.customer_id
					) AS row_num,
					cm.customer_id AS ValueText,
					cm.customer_name AS DisplayText,
					cm.customer_supply_text,
					TRIM(
						COALESCE(cm.customer_primary_address_line1, '') ||
						CASE
							WHEN COALESCE(cm.customer_primary_address_line1, '') <> ''
							 AND COALESCE(cm.customer_primary_address_line2, '') <> ''
							THEN ', '
							ELSE ''
						END ||
						COALESCE(cm.customer_primary_address_line2, '')
					) AS CustomerAddress,
					cm.customer_primary_address_line1,
					cm.customer_primary_address_line2,
					cm.customer_pin_code
				FROM v_get_customer_master cm
				WHERE cm.customer_status = 1
				  AND EXISTS
				  (
					  SELECT 1
					  FROM order_header oh
					  WHERE oh.customer_id = cm.customer_id
						AND oh.doc_status = 30
				  )
				  AND (
						COALESCE(@search_keyword, '') = ''
						OR cm.customer_name LIKE '%' || @search_keyword || '%'
					  )
			) X
			WHERE row_num > (@PageNumber * @PageSize)
			  AND row_num <= ((@PageNumber + 1) * @PageSize)
			ORDER BY row_num;

		END IF;

	END IF;


END
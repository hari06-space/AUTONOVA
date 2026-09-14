package com.autonoma.erp.modules.qmt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineListDTO {
    private Long id;
    private String assetId;
    private String assetName;
    private Long assetGroupId;
    private String assetGroupName;
    private Long assetTypeId;
    private String assetTypeName;
    private String make;
    private String modelNo;
    private Boolean status;
    private Date createdDate;
    private Date updatedDate;

    // Helper getter for frontend row?.assetGroup?.groupName compatibility
    public AssetGroupRef getAssetGroup() {
        if (assetGroupId == null && assetGroupName == null) return null;
        return new AssetGroupRef(assetGroupId, assetGroupName);
    }

    // Helper getter for frontend row?.assetType?.typeName and row?.assetType?.type compatibility
    public AssetTypeRef getAssetType() {
        if (assetTypeId == null && assetTypeName == null) return null;
        return new AssetTypeRef(assetTypeId, assetTypeName, assetTypeName);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetGroupRef {
        private Long id;
        private String groupName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetTypeRef {
        private Long id;
        private String typeName;
        private String type;
    }
}

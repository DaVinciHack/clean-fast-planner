import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace BristowHelidecks {
    type PropertyKeys = 'locationAlias' | 'cautions' | 'locationName' | 'baseOfOperation' | 'sourceIds' | 'fuelAvailable' | 'attachmentIds' | 'deckDvalue' | 'deckMaxWeight' | 'timeZone' | 'deckReportReceivedTime' | 'geoPoint' | 'weatherInformation' | 'ndb' | 'longName' | 'latestDeckReport' | 'createdDate' | 'validityDate' | 'nightStatus' | 'createdBy' | 'isActive' | 'updatedDate' | 'deckReportAttachmentId' | 'imageUrls' | 'deckDimensionsWidth' | 'issueDate' | 'isFixed' | 'limitations' | 'nonCompliance' | 'deckDimensionsLength' | 'deckHeading' | 'sourceSystems' | 'locationId' | 'locationType' | 'latitude' | 'updatedBy' | 'dayStatus' | 'deckReportSource' | 'deckHeight' | 'generalNotes' | 'weatherAvailable' | 'region' | 'lastInspectionDate' | 'fuelStatus' | 'longitude' | 'primaryRadio' | 'locationDescription' | 'primaryPhone' | 'parkDimensionsLength' | 'parkDvalue' | 'aimingCircle' | 'parkDimensionsWidth';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Aiming Circle'
         */
        readonly aimingCircle: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Attachment Ids'
         */
        readonly attachmentIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Base Of Operation'
         */
        readonly baseOfOperation: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cautions'
         */
        readonly cautions: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Created By'
         */
        readonly createdBy: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Created Date'
         */
        readonly createdDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Day Status'
         */
        readonly dayStatus: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Dimensions Length'
         */
        readonly deckDimensionsLength: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Dimensions Width'
         */
        readonly deckDimensionsWidth: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck DValue'
         */
        readonly deckDvalue: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Heading'
         */
        readonly deckHeading: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Height'
         */
        readonly deckHeight: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Max Weight'
         */
        readonly deckMaxWeight: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Report Attachment Id'
         */
        readonly deckReportAttachmentId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Report Received Time'
         */
        readonly deckReportReceivedTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Deck Report Source'
         */
        readonly deckReportSource: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Fuel Available'
         */
        readonly fuelAvailable: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Fuel Status'
         */
        readonly fuelStatus: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'General Notes'
         */
        readonly generalNotes: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Geo Point'
         */
        readonly geoPoint: $PropType['geopoint'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Image Urls'
         */
        readonly imageUrls: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Active'
         */
        readonly isActive: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Fixed'
         */
        readonly isFixed: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Issue Date'
         */
        readonly issueDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Last Inspection Date'
         */
        readonly lastInspectionDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Latest Deck Report'
         */
        readonly latestDeckReport: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Latitude'
         */
        readonly latitude: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Limitations'
         */
        readonly limitations: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location Alias'
         */
        readonly locationAlias: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location Description'
         */
        readonly locationDescription: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location Id'
         */
        readonly locationId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location Name'
         */
        readonly locationName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location Type'
         */
        readonly locationType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Longitude'
         */
        readonly longitude: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Long Name'
         */
        readonly longName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'NDB'
         */
        readonly ndb: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Night Status'
         */
        readonly nightStatus: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Non Compliance'
         */
        readonly nonCompliance: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Park Dimensions Length'
         */
        readonly parkDimensionsLength: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Park Dimensions Width'
         */
        readonly parkDimensionsWidth: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Park DValue'
         */
        readonly parkDvalue: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Primary Phone'
         */
        readonly primaryPhone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Primary Radio'
         */
        readonly primaryRadio: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Region'
         */
        readonly region: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Source Ids'
         */
        readonly sourceIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Source Systems'
         */
        readonly sourceSystems: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Time Zone'
         */
        readonly timeZone: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Updated By'
         */
        readonly updatedBy: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Updated Date'
         */
        readonly updatedDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Validity Date'
         */
        readonly validityDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Weather Available'
         */
        readonly weatherAvailable: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Weather Information'
         */
        readonly weatherInformation: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<BristowHelidecks, BristowHelidecks.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof BristowHelidecks.Props = keyof BristowHelidecks.Props> = $Osdk.Instance<BristowHelidecks, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof BristowHelidecks.Props = keyof BristowHelidecks.Props> = OsdkInstance<OPTIONS, K>;
}
export interface BristowHelidecks extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'BristowHelidecks';
    __DefinitionMetadata?: {
        objectSet: BristowHelidecks.ObjectSet;
        props: BristowHelidecks.Props;
        linksType: BristowHelidecks.Links;
        strictProps: BristowHelidecks.StrictProps;
        apiName: 'BristowHelidecks';
        description: 'All Helidecks  ';
        displayName: 'Bristow Helidecks';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'rig';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Bristow Helidecks';
        primaryKeyApiName: 'locationId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Aiming Circle'
             */
            aimingCircle: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Attachment Ids'
             */
            attachmentIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Base Of Operation'
             */
            baseOfOperation: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cautions'
             */
            cautions: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Created By'
             */
            createdBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Created Date'
             */
            createdDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Day Status'
             */
            dayStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Dimensions Length'
             */
            deckDimensionsLength: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Dimensions Width'
             */
            deckDimensionsWidth: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck DValue'
             */
            deckDvalue: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Heading'
             */
            deckHeading: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Height'
             */
            deckHeight: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Max Weight'
             */
            deckMaxWeight: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Report Attachment Id'
             */
            deckReportAttachmentId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Report Received Time'
             */
            deckReportReceivedTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Deck Report Source'
             */
            deckReportSource: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Fuel Available'
             */
            fuelAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Fuel Status'
             */
            fuelStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'General Notes'
             */
            generalNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Geo Point'
             */
            geoPoint: $PropertyDef<'geopoint', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Image Urls'
             */
            imageUrls: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Active'
             */
            isActive: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Fixed'
             */
            isFixed: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Issue Date'
             */
            issueDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Last Inspection Date'
             */
            lastInspectionDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Latest Deck Report'
             */
            latestDeckReport: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Latitude'
             */
            latitude: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Limitations'
             */
            limitations: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location Alias'
             */
            locationAlias: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location Description'
             */
            locationDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location Id'
             */
            locationId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location Name'
             */
            locationName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location Type'
             */
            locationType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Longitude'
             */
            longitude: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Long Name'
             */
            longName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'NDB'
             */
            ndb: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Night Status'
             */
            nightStatus: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Non Compliance'
             */
            nonCompliance: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Park Dimensions Length'
             */
            parkDimensionsLength: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Park Dimensions Width'
             */
            parkDimensionsWidth: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Park DValue'
             */
            parkDvalue: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Primary Phone'
             */
            primaryPhone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Primary Radio'
             */
            primaryRadio: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Region'
             */
            region: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Source Ids'
             */
            sourceIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Source Systems'
             */
            sourceSystems: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Time Zone'
             */
            timeZone: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Updated By'
             */
            updatedBy: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Updated Date'
             */
            updatedDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Validity Date'
             */
            validityDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Weather Available'
             */
            weatherAvailable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Weather Information'
             */
            weatherInformation: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.68f15a1b-1902-4ce1-8c9f-b74f42b8cfdb';
        status: 'EXPERIMENTAL';
        titleProperty: 'locationName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const BristowHelidecks: BristowHelidecks;

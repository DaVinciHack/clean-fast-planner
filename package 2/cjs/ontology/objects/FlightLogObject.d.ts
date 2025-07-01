import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace FlightLogObject {
    type PropertyKeys = 'captainDayTime' | 'comments' | 'captainId' | 'copilotId' | 'shutdownFuel' | 'soId' | 'legDayMinutes' | 'flightNumber' | 'medicName' | 'waypointActualTimes' | 'startupTime' | 'totalPaxWeight' | 'approachType' | 'logId' | 'onBlocksTime' | 'copilotDayTime' | 'legFuelUplifted' | 'onBlocksFuel' | 'totalBagsPaxWeight' | 'legLandingTimes' | 'paxNumber' | 'waypointActualFuel' | 'captainNightTime' | 'copilot' | 'bagsWeight' | 'offBlocksTime' | 'deviceId' | 'legPlannedTakeoffTimes' | 'copilotTotalTime' | 'soName' | 'copilotNightTime' | 'aircraftId' | 'legPlannedLandingTimes' | 'flightId' | 'legNightMinutes' | 'waypointNames' | 'captainTotalTime' | 'legTakeoffFuel' | 'landingOn' | 'captain' | 'isUploaded' | 'captainLandings' | 'incidentId' | 'copilotLandings' | 'rswId' | 'maintenanceNotes' | 'totalTime' | 'delayReasons' | 'totalFlightTime' | 'totalFuelBurned' | 'medicId' | 'legPilotFlying' | 'lastSyncTime' | 'legPlannedTakeoffFuel' | 'legTakeoffTimes' | 'rswName' | 'hasPendingChanges' | 'legLandingFuel' | 'legIds' | 'waypointPlannedTimes' | 'additionalCrewIds' | 'legNames' | 'logDate' | 'averagePaxWeight' | 'offBlocksFuel' | 'legLandings' | 'waypointPlannedFuel' | 'startupFuel' | 'legPlannedLandingFuel' | 'initialFuelUplifted';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly additionalCrewIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' aircraftId'
         */
        readonly aircraftId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly approachType: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'averagePaxWeight '
         */
        readonly averagePaxWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly bagsWeight: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captain: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captainDayTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captainId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captainLandings: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captainNightTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly captainTotalTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly comments: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilot: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotDayTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotLandings: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotNightTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly copilotTotalTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly delayReasons: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly deviceId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' flightId'
         */
        readonly flightId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly flightNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly hasPendingChanges: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly incidentId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly initialFuelUplifted: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly isUploaded: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly landingOn: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly lastSyncTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legDayMinutes: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legFuelUplifted: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legIds: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legLandingFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legLandings: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legLandingTimes: $PropType['timestamp'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legNames: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legNightMinutes: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legPilotFlying: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legPlannedLandingFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legPlannedLandingTimes: $PropType['timestamp'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legPlannedTakeoffFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legPlannedTakeoffTimes: $PropType['timestamp'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legTakeoffFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly legTakeoffTimes: $PropType['timestamp'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly logDate: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly logId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly maintenanceNotes: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly medicId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly medicName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly offBlocksFuel: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly offBlocksTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly onBlocksFuel: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly onBlocksTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly paxNumber: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly rswId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly rswName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly shutdownFuel: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly soId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly soName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly startupFuel: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly startupTime: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalBagsPaxWeight: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalFlightTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalFuelBurned: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalPaxWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalTime: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waypointActualFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waypointActualTimes: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waypointNames: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waypointPlannedFuel: $PropType['double'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly waypointPlannedTimes: $PropType['string'][] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<FlightLogObject, FlightLogObject.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof FlightLogObject.Props = keyof FlightLogObject.Props> = $Osdk.Instance<FlightLogObject, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof FlightLogObject.Props = keyof FlightLogObject.Props> = OsdkInstance<OPTIONS, K>;
}
export interface FlightLogObject extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'FlightLogObject';
    __DefinitionMetadata?: {
        objectSet: FlightLogObject.ObjectSet;
        props: FlightLogObject.Props;
        linksType: FlightLogObject.Links;
        strictProps: FlightLogObject.StrictProps;
        apiName: 'FlightLogObject';
        description: 'FlightLogObject';
        displayName: 'Flight Log Object';
        icon: {
            type: 'blueprint';
            color: '#BD6BBD';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Flight Log Objects';
        primaryKeyApiName: 'logId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             */
            additionalCrewIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' aircraftId'
             */
            aircraftId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            approachType: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'averagePaxWeight '
             */
            averagePaxWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            bagsWeight: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captain: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captainDayTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captainId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captainLandings: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captainNightTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            captainTotalTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            comments: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilot: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotDayTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotLandings: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotNightTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            copilotTotalTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            delayReasons: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            deviceId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' flightId'
             */
            flightId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            flightNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            hasPendingChanges: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            incidentId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            initialFuelUplifted: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            isUploaded: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            landingOn: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            lastSyncTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legDayMinutes: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legFuelUplifted: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legIds: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legLandingFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legLandings: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legLandingTimes: $PropertyDef<'timestamp', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legNightMinutes: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legPilotFlying: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legPlannedLandingFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legPlannedLandingTimes: $PropertyDef<'timestamp', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legPlannedTakeoffFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legPlannedTakeoffTimes: $PropertyDef<'timestamp', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legTakeoffFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            legTakeoffTimes: $PropertyDef<'timestamp', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            logDate: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            logId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            maintenanceNotes: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            medicId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            medicName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            offBlocksFuel: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            offBlocksTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            onBlocksFuel: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            onBlocksTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            paxNumber: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            rswId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            rswName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            shutdownFuel: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            soId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            soName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            startupFuel: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            startupTime: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalBagsPaxWeight: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalFlightTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalFuelBurned: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalPaxWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalTime: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waypointActualFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waypointActualTimes: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waypointNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waypointPlannedFuel: $PropertyDef<'double', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            waypointPlannedTimes: $PropertyDef<'string', 'nullable', 'array'>;
        };
        rid: 'ri.ontology.main.object-type.7d54b120-836f-4f39-9679-541e3a081f02';
        status: 'EXPERIMENTAL';
        titleProperty: 'flightNumber';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const FlightLogObject: FlightLogObject;

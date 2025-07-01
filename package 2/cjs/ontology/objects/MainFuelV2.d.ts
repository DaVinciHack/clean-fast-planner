import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { MainFlightObjectFp2 } from './MainFlightObjectFp2.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace MainFuelV2 {
    type PropertyKeys = 'plannedApproachFuel' | 'plannedReserveFuel' | 'actualFuelUplifteds' | 'minFuelBreakdown' | 'flightNumber' | 'plannedAraFuel' | 'stopDescriptions' | 'minTotalFuel' | 'stopExtraFuels' | 'stopReserveFuels' | 'refuelStopIndices' | 'totalFuelUplifted' | 'actualLandingFuels' | 'actualOffBlocksFuels' | 'actualPassengerWeight' | 'stopsMarkdownTable' | 'availablePassengers' | 'stopTripFuels' | 'actualFuelBurneds' | 'stopApproachFuels' | 'stopLocations' | 'actualTotalWeight' | 'requestedTotalWeight' | 'updatedAt' | 'availableWeight' | 'plannedDeckFuel' | 'plannedTaxiFuel' | 'weightBalanceData' | 'plannedContingencyAlternateFuel' | 'actualPassengers' | 'displayUnit' | 'actualBagWeight' | 'actualOnBlocksFuels' | 'averagePassengerWeight' | 'usesCombinedWeight' | 'aircraft' | 'averageBagWeight' | 'requestedBagWeight' | 'stopDeckFuels' | 'policyUuid' | 'createdAt' | 'stopContingencyFuels' | 'totalFuelBurned' | 'requestedPassengerWeight' | 'automationSummary' | 'plannedAlternateFuel' | 'flightUuid' | 'stopAraFuels' | 'uuid' | 'stopTaxiFuels' | 'passengerAdjustmentData' | 'roundTripFuel' | 'stopRequiredFuels' | 'plannedExtraFuel' | 'plannedTripFuel' | 'requestedPassengers' | 'actualTakeOffFuels' | 'plannedContingencyFuel' | 'actualLegNames' | 'calculationUnit' | 'policyName' | 'refuelAmounts' | 'stopExcessFuels';
    interface Links {
        readonly mainFlightObjectFp2: $SingleLinkAccessor<MainFlightObjectFp2>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualBagWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualFuelBurneds: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualFuelUplifteds: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualLandingFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualLegNames: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualOffBlocksFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualOnBlocksFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualPassengers: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualPassengerWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly actualTakeOffFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' actualTotalWeight'
         */
        readonly actualTotalWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly aircraft: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly automationSummary: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly availablePassengers: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' availableWeight'
         */
        readonly availableWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly averageBagWeight: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly averagePassengerWeight: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly calculationUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly createdAt: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly displayUnit: $PropType['string'] | undefined;
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
        readonly flightUuid: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly minFuelBreakdown: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly minTotalFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly passengerAdjustmentData: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedAlternateFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedApproachFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' plannedAraFuel'
         */
        readonly plannedAraFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedContingencyAlternateFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedContingencyFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedDeckFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' plannedExtraFuel'
         */
        readonly plannedExtraFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedReserveFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly plannedTaxiFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: '  plannedTripFuel'
         */
        readonly plannedTripFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly policyName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly policyUuid: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' refuelAmounts'
         */
        readonly refuelAmounts: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' refuelStopIndices'
         */
        readonly refuelStopIndices: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly requestedBagWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' requestedPassengers'
         */
        readonly requestedPassengers: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly requestedPassengerWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly requestedTotalWeight: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly roundTripFuel: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopApproachFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopAraFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopContingencyFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopDeckFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopDescriptions: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopExcessFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' stopExtraFuels'
         */
        readonly stopExtraFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' stopLocations'
         */
        readonly stopLocations: $PropType['string'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'stopRequiredFuels '
         */
        readonly stopRequiredFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopReserveFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopsMarkdownTable: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly stopTaxiFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' stopTripFuels'
         */
        readonly stopTripFuels: $PropType['integer'][] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalFuelBurned: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly totalFuelUplifted: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' updatedAt'
         */
        readonly updatedAt: $PropType['timestamp'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly usesCombinedWeight: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: ' uuid'
         */
        readonly uuid: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         */
        readonly weightBalanceData: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<MainFuelV2, MainFuelV2.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof MainFuelV2.Props = keyof MainFuelV2.Props> = $Osdk.Instance<MainFuelV2, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof MainFuelV2.Props = keyof MainFuelV2.Props> = OsdkInstance<OPTIONS, K>;
}
export interface MainFuelV2 extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'MainFuelV2';
    __DefinitionMetadata?: {
        objectSet: MainFuelV2.ObjectSet;
        props: MainFuelV2.Props;
        linksType: MainFuelV2.Links;
        strictProps: MainFuelV2.StrictProps;
        apiName: 'MainFuelV2';
        description: 'Main fuel object for flight planner V2';
        displayName: 'Main Fuel V2';
        icon: {
            type: 'blueprint';
            color: '#3FA6DA';
            name: 'fuel';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            mainFlightObjectFp2: $ObjectMetadata.Link<MainFlightObjectFp2, false>;
        };
        pluralDisplayName: 'Main Fuel V2s';
        primaryKeyApiName: 'uuid';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualBagWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualFuelBurneds: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualFuelUplifteds: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualLandingFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualLegNames: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualOffBlocksFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualOnBlocksFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualPassengers: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualPassengerWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            actualTakeOffFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' actualTotalWeight'
             */
            actualTotalWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            aircraft: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            automationSummary: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            availablePassengers: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' availableWeight'
             */
            availableWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            averageBagWeight: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            averagePassengerWeight: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            calculationUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            createdAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            displayUnit: $PropertyDef<'string', 'nullable', 'single'>;
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
            flightUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            minFuelBreakdown: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            minTotalFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            passengerAdjustmentData: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedAlternateFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedApproachFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' plannedAraFuel'
             */
            plannedAraFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedContingencyAlternateFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedContingencyFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedDeckFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' plannedExtraFuel'
             */
            plannedExtraFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedReserveFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            plannedTaxiFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: '  plannedTripFuel'
             */
            plannedTripFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            policyName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            policyUuid: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' refuelAmounts'
             */
            refuelAmounts: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' refuelStopIndices'
             */
            refuelStopIndices: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            requestedBagWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' requestedPassengers'
             */
            requestedPassengers: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            requestedPassengerWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            requestedTotalWeight: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            roundTripFuel: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopApproachFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopAraFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopContingencyFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopDeckFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopDescriptions: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopExcessFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' stopExtraFuels'
             */
            stopExtraFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' stopLocations'
             */
            stopLocations: $PropertyDef<'string', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'stopRequiredFuels '
             */
            stopRequiredFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopReserveFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopsMarkdownTable: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            stopTaxiFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' stopTripFuels'
             */
            stopTripFuels: $PropertyDef<'integer', 'nullable', 'array'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalFuelBurned: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            totalFuelUplifted: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' updatedAt'
             */
            updatedAt: $PropertyDef<'timestamp', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            usesCombinedWeight: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: ' uuid'
             */
            uuid: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             */
            weightBalanceData: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.250465c9-55b6-42a5-b6da-806ffafd35a8';
        status: 'EXPERIMENTAL';
        titleProperty: 'flightNumber';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const MainFuelV2: MainFuelV2;

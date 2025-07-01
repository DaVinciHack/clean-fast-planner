import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace User {
    type PropertyKeys = 'workShift' | 'email' | 'costCenterName' | 'scheduleTsSync' | 'startDate' | 'jobName' | 'userId' | 'status' | 'costCenterId' | 'employeeId' | 'location' | 'fullName' | 'dateOfBirth' | 'timeZone' | 'deptId' | 'sapCompanyId' | 'userPersonType' | 'jobId' | 'foundryUsername' | 'isPilot' | 'username' | 'foundryEmail' | 'jobFamilyGroup' | 'aoc' | 'orgUnit' | 'organization' | 'endDate' | 'country' | 'foundryUserId' | 'lastName' | 'deptName' | 'employeeNumber' | 'assignmentEndDate' | 'jobDescription' | 'firstName' | 'orgAoc' | 'assignmentStartDate' | 'supervisorEmpNumber' | 'state' | 'companyName';
    type Links = {};
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Aoc'
         */
        readonly aoc: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Assignment End Date'
         */
        readonly assignmentEndDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Assignment Start Date'
         */
        readonly assignmentStartDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Company Name'
         */
        readonly companyName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cost Center Id'
         */
        readonly costCenterId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Cost Center Name'
         */
        readonly costCenterName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Country'
         */
        readonly country: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Date Of Birth'
         */
        readonly dateOfBirth: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Dept Id'
         */
        readonly deptId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Dept Name'
         */
        readonly deptName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Email'
         */
        readonly email: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Employee Id'
         */
        readonly employeeId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Employee Number'
         */
        readonly employeeNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'End Date'
         */
        readonly endDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'First Name'
         */
        readonly firstName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Foundry Email'
         */
        readonly foundryEmail: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Foundry User Id'
         */
        readonly foundryUserId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Foundry Username'
         */
        readonly foundryUsername: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Full Name'
         */
        readonly fullName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Is Pilot'
         */
        readonly isPilot: $PropType['boolean'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Job Description'
         */
        readonly jobDescription: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Job Family Group'
         */
        readonly jobFamilyGroup: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Job Id'
         */
        readonly jobId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Job Name'
         */
        readonly jobName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Last Name'
         */
        readonly lastName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location'
         */
        readonly location: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Organization'
         */
        readonly organization: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Org Aoc'
         */
        readonly orgAoc: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Org Unit'
         */
        readonly orgUnit: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Sap Company Id'
         */
        readonly sapCompanyId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Schedule Ts Sync'
         */
        readonly scheduleTsSync: $PropType['stringTimeseries'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Start Date'
         */
        readonly startDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'State'
         */
        readonly state: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Status'
         */
        readonly status: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Supervisor Emp Number'
         */
        readonly supervisorEmpNumber: $PropType['string'] | undefined;
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
         *   display name: 'User Id'
         */
        readonly userId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Username'
         */
        readonly username: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'User Person Type'
         */
        readonly userPersonType: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Work Shift'
         */
        readonly workShift: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<User, User.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof User.Props = keyof User.Props> = $Osdk.Instance<User, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof User.Props = keyof User.Props> = OsdkInstance<OPTIONS, K>;
}
export interface User extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'User';
    __DefinitionMetadata?: {
        objectSet: User.ObjectSet;
        props: User.Props;
        linksType: User.Links;
        strictProps: User.StrictProps;
        apiName: 'User';
        description: '';
        displayName: 'User';
        icon: {
            type: 'blueprint';
            color: '#61c7f9';
            name: 'mugshot';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {};
        pluralDisplayName: 'Users';
        primaryKeyApiName: 'userId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Aoc'
             */
            aoc: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Assignment End Date'
             */
            assignmentEndDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Assignment Start Date'
             */
            assignmentStartDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Company Name'
             */
            companyName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cost Center Id'
             */
            costCenterId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Cost Center Name'
             */
            costCenterName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Country'
             */
            country: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Date Of Birth'
             */
            dateOfBirth: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Dept Id'
             */
            deptId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Dept Name'
             */
            deptName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Email'
             */
            email: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Employee Id'
             */
            employeeId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Employee Number'
             */
            employeeNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'End Date'
             */
            endDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'First Name'
             */
            firstName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Foundry Email'
             */
            foundryEmail: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Foundry User Id'
             */
            foundryUserId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Foundry Username'
             */
            foundryUsername: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Full Name'
             */
            fullName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Is Pilot'
             */
            isPilot: $PropertyDef<'boolean', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Job Description'
             */
            jobDescription: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Job Family Group'
             */
            jobFamilyGroup: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Job Id'
             */
            jobId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Job Name'
             */
            jobName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Last Name'
             */
            lastName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location'
             */
            location: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Organization'
             */
            organization: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Org Aoc'
             */
            orgAoc: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Org Unit'
             */
            orgUnit: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Sap Company Id'
             */
            sapCompanyId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Schedule Ts Sync'
             */
            scheduleTsSync: $PropertyDef<'stringTimeseries', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Start Date'
             */
            startDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'State'
             */
            state: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Status'
             */
            status: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Supervisor Emp Number'
             */
            supervisorEmpNumber: $PropertyDef<'string', 'nullable', 'single'>;
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
             *   display name: 'User Id'
             */
            userId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Username'
             */
            username: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'User Person Type'
             */
            userPersonType: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Work Shift'
             */
            workShift: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.bf45a3bd-f60f-400e-8fcf-5adc0a44e8de';
        status: 'EXPERIMENTAL';
        titleProperty: 'fullName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const User: User;

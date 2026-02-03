import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DevicesService } from './devices.service';
import { ApiClientService } from '../../../data-access';

describe('DevicesService', () => {
  let service: DevicesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DevicesService, ApiClientService]
    });
    service = TestBed.inject(DevicesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDevices', () => {
    it('should fetch devices with pagination', () => {
      const mockDevices = [
        { id: 'device-001', name: 'Test Device', status: 'online' }
      ];

      service.getDevices({ page: 1, limit: 10 }).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].name).toBe('Test Device');
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/api/devices') && req.params.has('_page')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('_page')).toBe('1');
      expect(req.request.params.get('_limit')).toBe('10');

      req.flush(mockDevices, {
        headers: { 'X-Total-Count': '1' }
      });
    });

    it('should fetch devices with status filter', () => {
      service.getDevices({ page: 1, limit: 10 }, { status: 'online' }).subscribe();

      const req = httpMock.expectOne(
        req => req.url.includes('/api/devices') && req.params.get('status') === 'online'
      );
      expect(req.request.method).toBe('GET');

      req.flush([], { headers: { 'X-Total-Count': '0' } });
    });

    it('should fetch devices with sorting', () => {
      service.getDevices({ page: 1, limit: 10, sort: 'name', order: 'asc' }).subscribe();

      const req = httpMock.expectOne(
        req => req.params.get('_sort') === 'name' && req.params.get('_order') === 'asc'
      );
      expect(req.request.method).toBe('GET');
      req.flush([], { headers: { 'X-Total-Count': '0' } });
    });
  });

  describe('getDevice', () => {
    it('should fetch a single device by id', () => {
      const mockDevice = {
        id: 'device-001',
        name: 'Test Device',
        status: 'online',
        serialNumber: 'SN-123456'
      };

      service.getDevice('device-001').subscribe(device => {
        expect(device.id).toBe('device-001');
        expect(device.name).toBe('Test Device');
      });

      const req = httpMock.expectOne('/api/devices/device-001');
      expect(req.request.method).toBe('GET');
      req.flush(mockDevice);
    });
  });

  describe('updateDevice', () => {
    it('should update a device', () => {
      const updateData = { name: 'Updated Device' };
      const mockUpdatedDevice = {
        id: 'device-001',
        name: 'Updated Device',
        status: 'online'
      };

      service.updateDevice('device-001', updateData).subscribe(device => {
        expect(device.name).toBe('Updated Device');
      });

      const req = httpMock.expectOne('/api/devices/device-001');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.name).toBe('Updated Device');
      req.flush(mockUpdatedDevice);
    });
  });

  describe('getDeviceAuditLogs', () => {
    it('should fetch audit logs for a device', () => {
      const mockLogs = [
        {
          id: 'log-001',
          entityType: 'device',
          entityId: 'device-001',
          action: 'device_created',
          description: 'Device created'
        }
      ];

      service.getDeviceAuditLogs('device-001').subscribe(logs => {
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('device_created');
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/api/auditLogs') &&
          req.params.get('entityType') === 'device' &&
          req.params.get('entityId') === 'device-001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockLogs);
    });
  });
});

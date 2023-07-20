import { TestBed } from '@angular/core/testing';

import { CinchyService } from './cinchy.service';

describe('CinchyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CinchyService = TestBed.get(CinchyService);
    expect(service).toBeTruthy();
  });
});

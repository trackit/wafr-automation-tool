import { UserClaimsMissingError } from '../../../errors/UserErrors';
import { APIGatewayProxyEventMother } from '../APIGatewayProxyEventMother';
import { getUserFromEvent } from './getUserFromEvent';

describe('getUserFromEvent', () => {
  it('should extract user from event and return it', () => {
    const event = APIGatewayProxyEventMother.basic()
      .withUserClaims({
        sub: 'user-id',
        email: 'user-id@test.io',
      })
      .build();

    expect(getUserFromEvent(event)).toEqual({
      id: 'user-id',
      organizationDomain: 'test.io',
      email: 'user-id@test.io',
    });
  });

  it('should throw a UserClaimsMissingError if user claims are missing', () => {
    const event = APIGatewayProxyEventMother.basic()
      .withUserClaims(undefined)
      .build();

    expect(() => getUserFromEvent(event)).toThrow(UserClaimsMissingError);
  });
});

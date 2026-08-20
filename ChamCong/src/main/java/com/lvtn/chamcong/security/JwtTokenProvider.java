package com.lvtn.chamcong.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    public String generateToken(String username, String role, Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return JWT.create()
                .withSubject(username)
                .withClaim("role", role)
                .withClaim("userId", userId)
                .withIssuedAt(now)
                .withExpiresAt(expiryDate)
                .sign(Algorithm.HMAC256(jwtSecret));
    }

    public DecodedJWT validateAndDecodeToken(String token) {
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        JWTVerifier verifier = JWT.require(algorithm).build();
        return verifier.verify(token);
    }

    public String getUsernameFromDecodedJWT(DecodedJWT decodedJWT) {
        return decodedJWT.getSubject();
    }

    public String getRoleFromDecodedJWT(DecodedJWT decodedJWT) {
        return decodedJWT.getClaim("role").asString();
    }

    public Long getUserIdFromDecodedJWT(DecodedJWT decodedJWT) {
        return decodedJWT.getClaim("userId").asLong();
    }
}
